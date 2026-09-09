package handlers

import (
	"database/sql"
	"errors"
	"go-api/internal/middleware"
	"net/http"
	"time"
)

type VideoHandler struct {
	db *sql.DB
}


//GET /videos/editor
func NewVideHandler(db *sql.DB) (*VideoHandler, error) {
	if db == nil {
		return nil, errors.New("db is required")
	}
	return &VideoHandler{
		db: db,
	}, nil
}

type EditorVideoResponse struct {
	ID                string    `json:"id"`
	Title             *string   `json:"title"`
	OriginalFileName  string    `json:"originalFileName"`
	OriginalS3Key     string    `json:"originalS3Key"`
	OriginalMimeType  *string   `json:"originalMimeType"`
	OriginalSize      *int64    `json:"originalSize"`
	PreviewPrefix     *string   `json:"previewPrefix"`
	MasterPlaylistKey *string   `json:"masterPlaylistKey"`
	Status            string    `json:"status"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type GetEditorVideosResponse struct {
	Videos []EditorVideoResponse `json:"videos"`
}

func (h *VideoHandler) GetEditorVideos(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}
	rows,err := h.db.QueryContext(r.Context(),
		`
	SELECT
		"id",
		"title",
		"originalFileName",
		"originalS3Key",
		"originalMimeType",
		"originalSize",
		"previewPrefix",
		"masterPlaylistKey",
		"status",
		"createdAt",
		"updatedAt"
	FROM "Video"
	WHERE "editorId" = $1
	ORDER BY "createdAt" DESC
	`,
		userID,
	)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch videos",
		})
		return
	}
	defer rows.Close()

	videos := []EditorVideoResponse{}

	for rows.Next() {
		var video EditorVideoResponse
		if err := rows.Scan(
			&video.ID,
			&video.Title,
			&video.OriginalFileName,
			&video.OriginalS3Key,
			&video.OriginalMimeType,
			&video.OriginalSize,
			&video.PreviewPrefix,
			&video.MasterPlaylistKey,
			&video.Status,
			&video.CreatedAt,
			&video.UpdatedAt,
		); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error": "Failed to read videos",
			})
			return
		}
		videos = append(videos, video)
	}
	if err := rows.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to read videos",
		})
		return
	}
	writeJSON(w, http.StatusOK, GetEditorVideosResponse{
		Videos: videos,
	})
}

type ChannelResponse struct {
	ChannelID          *string `json:"channelId"`
	ChannelTitle       *string `json:"channelTitle"`
	GoogleAccountEmail *string `json:"googleAccountEmail"`
	Connected          bool    `json:"connected"`
}

type CreatorResponse struct {
	ID      string           `json:"id"`
	Name    *string          `json:"name"`
	Email   string           `json:"email"`
	Role    string           `json:"role"`
	Channel *ChannelResponse `json:"channel"`
}

type VideoDetailResponse struct {
	ID                string          `json:"id"`
	Title             *string         `json:"title"`
	OriginalFileName  string          `json:"originalFileName"`
	OriginalS3Key     string          `json:"originalS3Key"`
	OriginalMimeType  *string         `json:"originalMimeType"`
	OriginalSize      *int64          `json:"originalSize"`
	PreviewPrefix     *string         `json:"previewPrefix"`
	MasterPlaylistKey *string         `json:"masterPlaylistKey"`
	Status            string          `json:"status"`
	CreatedAt         time.Time       `json:"createdAt"`
	UpdatedAt         time.Time       `json:"updatedAt"`
	Creator           CreatorResponse `json:"creator"`
}

//GET /videos/{id}
func (h *VideoHandler) GetVideoDetail(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	videoID := r.PathValue("id")
	if videoID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Video ID is required",
		})
		return
	}

	var (
		video VideoDetailResponse
		creatorName,
		channelTitle,
		channelID,
		googleAccountEmail sql.NullString
		channelConnected bool
	)

	err := h.db.QueryRowContext(r.Context(),
		`
	SELECT
		v."id",
		v."title",
		v."originalFileName",
		v."originalS3Key",
		v."originalMimeType",
		v."originalSize",
		v."previewPrefix",
		v."masterPlaylistKey",
		v."status",
		v."createdAt",
		v."updatedAt",
		u."id",
		u."name",
		u."email",
		u."role",
		c."youtubeChannelId",
		c."youtubeChannelTitle",
		c."googleAccountEmail"
	FROM "Video" v
	JOIN "User" u ON u."id" = v."creatorId"
	LEFT JOIN "YouTubeConnection" c ON c."userId" = u."id"
	WHERE v."id" = $1 AND v."editorId" = $2
	`,
		videoID,
		userID,
	).Scan(
		&video.ID,
		&video.Title,
		&video.OriginalFileName,
		&video.OriginalS3Key,
		&video.OriginalMimeType,
		&video.OriginalSize,
		&video.PreviewPrefix,
		&video.MasterPlaylistKey,
		&video.Status,
		&video.CreatedAt,
		&video.UpdatedAt,
		&video.Creator.ID,
		&creatorName,
		&video.Creator.Email,
		&video.Creator.Role,
		&channelID,
		&channelTitle,
		&googleAccountEmail,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error": "Video not found",
			})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch video",
		})
		return
	}

	video.Creator.Name = optionalString(creatorName)
	channelConnected = channelID.Valid

	video.Creator.Channel = &ChannelResponse{
		ChannelID:          optionalString(channelID),
		ChannelTitle:       optionalString(channelTitle),
		GoogleAccountEmail: optionalString(googleAccountEmail),
		Connected:          channelConnected,
	}

	writeJSON(w, http.StatusOK, video)
}

func optionalString(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}
