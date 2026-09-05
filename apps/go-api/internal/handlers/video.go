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

type GetEditorVideosResponse  struct {
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
