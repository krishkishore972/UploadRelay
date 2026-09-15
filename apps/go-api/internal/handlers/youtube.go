package handlers

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"go-api/internal/config"
	tokencrypto "go-api/internal/crypto"
	"go-api/internal/middleware"
	"net/http"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
)

type YouTubeHandler struct {
	db        *sql.DB
	oauth     *oauth2.Config
	cipher    *tokencrypto.TokenCipher
	webAppURL string
}

func NewYouTubeHandler(cfg config.Config, db *sql.DB) (*YouTubeHandler, error) {
	if db == nil {
		return nil, errors.New("db is required")
	}

	cipher, err := tokencrypto.NewTokenCipher(cfg.TokenEncryptionKey)
	if err != nil {
		return nil, err
	}

	return &YouTubeHandler{
		db: db,
		oauth: &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURI,
			Scopes: []string{
				youtube.YoutubeUploadScope,
				youtube.YoutubeReadonlyScope,
				"openid",
				"https://www.googleapis.com/auth/userinfo.email",
			},
			Endpoint: google.Endpoint,
		},
		cipher:    cipher,
		webAppURL: cfg.WebAppURL,
	}, nil
}

type StartOAuthResponse struct {
	URL string `json:"url"`
}
type GoogleUserInfo struct {
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
}

func (h *YouTubeHandler) StartOAuth(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	state, err := randomState()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create oauth state"})
		return
	}

	_, err = h.db.ExecContext(r.Context(),
		`INSERT INTO "OAuthState" ("state", "userId", "expiresAt")
		 VALUES ($1, $2, $3)`,
		state,
		userID,
		time.Now().Add(10*time.Minute),
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to save oauth state"})
		return
	}

	url := h.oauth.AuthCodeURL(
		state,
		oauth2.AccessTypeOffline,
		oauth2.ApprovalForce,
	)

	writeJSON(w, http.StatusOK, StartOAuthResponse{URL: url})
}

func (h *YouTubeHandler) OAuthCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if errText := r.URL.Query().Get("error"); errText != "" {
		http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=denied", http.StatusFound)
		return
	}

	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	if code == "" || state == "" {
		http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=invalid", http.StatusFound)
		return
	}

	userID, err := h.consumeState(ctx, state)
	if err != nil {
		http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=state_invalid", http.StatusFound)
		return
	}

	token, err := h.oauth.Exchange(ctx, code)
	if err != nil {
		http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=exchange_failed", http.StatusFound)
		return
	}

	client := h.oauth.Client(ctx, token)

	googleAccountEmail, err := fetchGoogleAccountEmail(ctx, client)
	if err != nil {
		http.Redirect(
			w,
			r,
			h.webAppURL+"/dashboard/youtube?youtube=email_failed",
			http.StatusFound,
		)
		return
	}

	service, err := youtube.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=service_failed", http.StatusFound)
		return
	}

	channels, err := service.Channels.List([]string{"snippet"}).Mine(true).Do()
	if err != nil || len(channels.Items) == 0 {
		http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=channel_failed", http.StatusFound)
		return
	}

	channel := channels.Items[0]

	accessTokenEncrypted, err := h.cipher.Encrypt(token.AccessToken)
	if err != nil {
		http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=encrypt_failed", http.StatusFound)
		return
	}

	var refreshTokenEncrypted string

	if token.RefreshToken != "" {
		refreshTokenEncrypted, err = h.cipher.Encrypt(token.RefreshToken)
		if err != nil {
			http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=encrypt_failed", http.StatusFound)
			return
		}
	} else {
		err = h.db.QueryRowContext(ctx,
			`SELECT "refreshTokenEncrypted"
		 FROM "YouTubeConnection"
		 WHERE "userId" = $1`,
			userID,
		).Scan(&refreshTokenEncrypted)

		if err != nil {
			http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=no_refresh_token", http.StatusFound)
			return
		}
	}

	_, err = h.db.ExecContext(ctx,
		`
		INSERT INTO "YouTubeConnection" (
			"userId",
			"googleAccountEmail",
			"youtubeChannelId",
			"youtubeChannelTitle",
			"accessTokenEncrypted",
			"refreshTokenEncrypted",
			"tokenExpiry",
			"scope",
			"updatedAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
		ON CONFLICT ("userId") DO UPDATE SET
			"googleAccountEmail" = EXCLUDED."googleAccountEmail",
			"youtubeChannelId" = EXCLUDED."youtubeChannelId",
			"youtubeChannelTitle" = EXCLUDED."youtubeChannelTitle",
			"accessTokenEncrypted" = EXCLUDED."accessTokenEncrypted",
			"refreshTokenEncrypted" = EXCLUDED."refreshTokenEncrypted",
			"tokenExpiry" = EXCLUDED."tokenExpiry",
			"scope" = EXCLUDED."scope",
			"updatedAt" = CURRENT_TIMESTAMP
		`,
		userID,
		googleAccountEmail,
		channel.Id,
		channel.Snippet.Title,
		accessTokenEncrypted,
		refreshTokenEncrypted,
		token.Expiry,
		token.Extra("scope"),
	)
	if err != nil {
		http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=save_failed", http.StatusFound)
		return
	}

	http.Redirect(w, r, h.webAppURL+"/dashboard/youtube?youtube=connected", http.StatusFound)
}

func fetchGoogleAccountEmail(
	ctx context.Context,
	client *http.Client,
) (string, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://openidconnect.googleapis.com/v1/userinfo",
		nil,
	)
	if err != nil {
		return "", fmt.Errorf("create userinfo request: %w", err)
	}

	response, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch google userinfo: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("google userinfo returned status %d", response.StatusCode)
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(response.Body).Decode(&userInfo); err != nil {
		return "", fmt.Errorf("decode google userinfo: %w", err)
	}

	if userInfo.Email == "" {
		return "", errors.New("google account email is missing")
	}

	if !userInfo.EmailVerified {
		return "", errors.New("google account email is not verified")
	}

	return userInfo.Email, nil
}

func (h *YouTubeHandler) GetConnection(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var channelID, channelTitle, googleEmail sql.NullString
	var tokenExpiry sql.NullTime

	err := h.db.QueryRowContext(r.Context(),
		`
		SELECT "youtubeChannelId", "youtubeChannelTitle", "googleAccountEmail", "tokenExpiry"
		FROM "YouTubeConnection"
		WHERE "userId" = $1
		`,
		userID,
	).Scan(&channelID, &channelTitle, &googleEmail, &tokenExpiry)

	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusOK, map[string]any{"connected": false})
		return
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to load connection"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"connected":          true,
		"channelId":          nullableString(channelID),
		"channelTitle":       nullableString(channelTitle),
		"googleAccountEmail": nullableString(googleEmail),
		"tokenExpiry":        nullableTime(tokenExpiry),
	})
}

func (h *YouTubeHandler) Disconnect(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	_, err := h.db.ExecContext(r.Context(),
		`DELETE FROM "YouTubeConnection" WHERE "userId" = $1`,
		userID,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to disconnect"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"connected": false})
}

func (h *YouTubeHandler) consumeState(ctx context.Context, state string) (string, error) {
	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	var userID string
	err = tx.QueryRowContext(ctx,
		`
		SELECT "userId"
		FROM "OAuthState"
		WHERE "state" = $1
		  AND "usedAt" IS NULL
		  AND "expiresAt" > CURRENT_TIMESTAMP
		FOR UPDATE
		`,
		state,
	).Scan(&userID)
	if err != nil {
		return "", err
	}

	_, err = tx.ExecContext(ctx,
		`UPDATE "OAuthState" SET "usedAt" = CURRENT_TIMESTAMP WHERE "state" = $1`,
		state,
	)
	if err != nil {
		return "", err
	}

	if err := tx.Commit(); err != nil {
		return "", err
	}

	return userID, nil
}

func randomState() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func nullableString(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func nullableTime(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}
	return &value.Time
}
