package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"go-api/internal/middleware"
	"go-api/internal/tasks"
	"net/http"

	"github.com/hibiken/asynq"
)

type PublishHandler struct {
	db    *sql.DB
	queue *asynq.Client
}

func NewPublishHandler(db *sql.DB, queue *asynq.Client) (*PublishHandler, error) {
	if db == nil {
		return nil, errors.New("db is required")
	}
	if queue == nil {
		return nil, errors.New("queue is required")
	}

	return &PublishHandler{db: db, queue: queue}, nil
}

type PublishVideoRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Privacy     string `json:"privacy"`
}

type PublishVideoResponse struct {
	JobID  string `json:"jobId"`
	Status string `json:"status"`
}

func (h *PublishHandler) PublishVideo(w http.ResponseWriter, r *http.Request) {
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

	var req PublishVideoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title is required"})
		return
	}

	if req.Privacy == "" {
		req.Privacy = "PRIVATE"
	}

	if req.Privacy != "PRIVATE" && req.Privacy != "UNLISTED" && req.Privacy != "PUBLIC" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid privacy"})
		return
	}
	tx, err := h.db.BeginTx(r.Context(), nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to start publish"})
		return
	}
	defer tx.Rollback()

	var creatorID string
	var youtubeConnectionID string

	err = tx.QueryRowContext(r.Context(),
		`
		SELECT v."creatorId", yc."id"
		FROM "Video" v
		JOIN "YouTubeConnection" yc ON yc."userId" = v."creatorId"
		WHERE v."id" = $1
		  AND v."creatorId" = $2
		  AND v."status" = 'APPROVED'
		FOR UPDATE OF v
		`,
		videoID,
		userID,
	).Scan(&creatorID, &youtubeConnectionID)

	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "Video must be approved and connected to your YouTube channel before publishing",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to validate publish"})
		return
	}

	var jobID string

	err = tx.QueryRowContext(r.Context(),
		`
		INSERT INTO "PublishJob" (
			"videoId",
			"youtubeConnectionId",
			"title",
			"description",
			"privacy",
			"status",
			"updatedAt"
		)
		VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP)
		RETURNING "id"
		`,
		videoID,
		youtubeConnectionID,
		req.Title,
		nullIfEmpty(req.Description),
		req.Privacy,
	).Scan(&jobID)

	if err != nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "A publish job already exists for this video"})
		return
	}

	_, err = tx.ExecContext(r.Context(),
		`
		UPDATE "Video"
		SET "status" = 'PUBLISHING',
		    "updatedAt" = CURRENT_TIMESTAMP
		WHERE "id" = $1
		`,
		videoID,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to update video status"})
		return
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create publish job"})
		return
	}
	task := tasks.AddPublishJob(jobID, videoID)
	if _, err := h.queue.Enqueue(task); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Publish job created but failed to queue worker task",
		})
		return
	}
	writeJSON(w, http.StatusAccepted, PublishVideoResponse{
		JobID:  jobID,
		Status: "PENDING",
	})
}

func nullIfEmpty(value string) any {
	if value == "" {
		return nil
	}
	return value
}
