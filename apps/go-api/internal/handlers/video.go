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
	rows, err := h.db.QueryContext(r.Context(),
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

type CreatorVideoResponse struct {
	ID                string    `json:"id"`
	Title             *string   `json:"title"`
	OriginalFileName  string    `json:"originalFileName"`
	OriginalS3Key     string    `json:"originalS3Key"`
	OriginalMimeType  *string   `json:"originalMimeType"`
	OriginalSize      *int64    `json:"originalSize"`
	PreviewPrefix     *string   `json:"previewPrefix"`
	MasterPlaylistKey *string   `json:"masterPlaylistKey"`
	Status            string    `json:"status"`
	EditorID          string    `json:"editorId"`
	EditorName        *string   `json:"editorName"`
	EditorEmail       string    `json:"editorEmail"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type GetCreatorVideosResponse struct {
	Videos []CreatorVideoResponse `json:"videos"`
}

// GET /videos/creator
func (h *VideoHandler) GetCreatorVideos(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	rows, err := h.db.QueryContext(r.Context(),
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
			v."editorId",
			e."name",
			e."email",
			v."createdAt",
			v."updatedAt"
		FROM "Video" v
		JOIN "User" e ON e."id" = v."editorId"
		WHERE v."creatorId" = $1
		ORDER BY v."createdAt" DESC
		`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch videos"})
		return
	}
	defer rows.Close()

	videos := []CreatorVideoResponse{}
	for rows.Next() {
		var video CreatorVideoResponse
		var editorName sql.NullString
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
			&video.EditorID,
			&editorName,
			&video.EditorEmail,
			&video.CreatedAt,
			&video.UpdatedAt,
		); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to read videos"})
			return
		}
		if editorName.Valid {
			video.EditorName = &editorName.String
		}
		videos = append(videos, video)
	}
	if err := rows.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to read videos"})
		return
	}
	writeJSON(w, http.StatusOK, GetCreatorVideosResponse{Videos: videos})
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

type PublishJobResponse struct {
	ID             string    `json:"id"`
	Status         string    `json:"status"`
	YouTubeVideoID *string   `json:"youtubeVideoId"`
	YouTubeURL     *string   `json:"youtubeUrl"`
	ErrorMessage   *string   `json:"errorMessage"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type VideoDetailResponse struct {
	ID                string              `json:"id"`
	Title             *string             `json:"title"`
	OriginalFileName  string              `json:"originalFileName"`
	OriginalS3Key     string              `json:"originalS3Key"`
	OriginalMimeType  *string             `json:"originalMimeType"`
	OriginalSize      *int64              `json:"originalSize"`
	PreviewPrefix     *string             `json:"previewPrefix"`
	MasterPlaylistKey *string             `json:"masterPlaylistKey"`
	Status            string              `json:"status"`
	PublishJob        *PublishJobResponse `json:"publishJob"`
	CreatedAt         time.Time           `json:"createdAt"`
	UpdatedAt         time.Time           `json:"updatedAt"`
	Creator           CreatorResponse     `json:"creator"`
}

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
	WHERE v."id" = $1 AND (v."editorId" = $2 OR v."creatorId" = $2)
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

	var publishJob PublishJobResponse
	var youtubeVideoID, youtubeURL, errorMessage sql.NullString

	err = h.db.QueryRowContext(r.Context(),
		`
	SELECT
		"id",
		"status",
		"youtubeVideoId",
		"youtubeUrl",
		"errorMessage",
		"createdAt",
		"updatedAt"
	FROM "PublishJob"
	WHERE "videoId" = $1
	ORDER BY "createdAt" DESC
	LIMIT 1
	`,
		videoID,
	).Scan(
		&publishJob.ID,
		&publishJob.Status,
		&youtubeVideoID,
		&youtubeURL,
		&errorMessage,
		&publishJob.CreatedAt,
		&publishJob.UpdatedAt,
	)

	if err == nil {
		publishJob.YouTubeVideoID = optionalString(youtubeVideoID)
		publishJob.YouTubeURL = optionalString(youtubeURL)
		publishJob.ErrorMessage = optionalString(errorMessage)
		video.PublishJob = &publishJob
	} else if !errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch publish job",
		})
		return
	}

	writeJSON(w, http.StatusOK, video)
}

func optionalString(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

// POST /videos/{id}/submit — editor only
// PREVIEW_READY → APPROVAL_REQUESTED
func (h *VideoHandler) SubmitForReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}
	videoID := r.PathValue("id")
	if videoID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Video ID is required"})
		return
	}

	result, err := h.db.ExecContext(r.Context(),
		`UPDATE "Video"
		 SET "status" = 'APPROVAL_REQUESTED',
		     "approvalRequestedAt" = CURRENT_TIMESTAMP,
		     "updatedAt" = CURRENT_TIMESTAMP
		 WHERE "id" = $1 AND "editorId" = $2 AND "status" = 'PREVIEW_READY'`,
		videoID, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to submit video"})
		return
	}
	rows, _ := result.RowsAffected()
	if rows != 1 {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "Only preview-ready videos can be submitted, or not your video"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "APPROVAL_REQUESTED"})
}

// POST /videos/{id}/approve — creator only
// APPROVAL_REQUESTED → APPROVED
func (h *VideoHandler) ApproveVideo(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}
	videoID := r.PathValue("id")
	if videoID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Video ID is required"})
		return
	}

	result, err := h.db.ExecContext(r.Context(),
		`UPDATE "Video"
		 SET "status" = 'APPROVED',
		     "approvedAt" = CURRENT_TIMESTAMP,
		     "updatedAt" = CURRENT_TIMESTAMP
		 WHERE "id" = $1 AND "creatorId" = $2 AND "status" = 'APPROVAL_REQUESTED'`,
		videoID, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to approve video"})
		return
	}
	rows, _ := result.RowsAffected()
	if rows != 1 {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "Only videos awaiting approval can be approved, or not your video"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "APPROVED"})
}

// POST /videos/{id}/reject — creator only
// APPROVAL_REQUESTED → REJECTED
func (h *VideoHandler) RejectVideo(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}
	videoID := r.PathValue("id")
	if videoID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Video ID is required"})
		return
	}

	result, err := h.db.ExecContext(r.Context(),
		`UPDATE "Video"
		 SET "status" = 'REJECTED',
		     "rejectedAt" = CURRENT_TIMESTAMP,
		     "updatedAt" = CURRENT_TIMESTAMP
		 WHERE "id" = $1 AND "creatorId" = $2 AND "status" = 'APPROVAL_REQUESTED'`,
		videoID, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to reject video"})
		return
	}
	rows, _ := result.RowsAffected()
	if rows != 1 {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "Only videos awaiting approval can be rejected, or not your video"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "REJECTED"})
}
