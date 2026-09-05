package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"go-api/internal/config"
	"go-api/internal/tasks"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"go-api/internal/middleware"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

/*

POST /uploads/create
body: { fileName, fileType, fileSize }
returns: { key, uploadId }

POST /uploads/sign-part
body: { key, uploadId, partNumber }
returns: { signedUrl, partNumber }

POST /uploads/complete
body: { key, uploadId, parts: [{ PartNumber, ETag }] }
returns: { message, location, key, bucket }

POST /uploads/abort
body: { key, uploadId }
returns: { message, key, uploadId }
package handlers

*/

type MultipartHandler struct {
	bucket    string
	client    *s3.Client
	presigner *s3.PresignClient
	queue     *asynq.Client
	db        *sql.DB
}

func NewMultipartHandler(cfg config.Config, queue *asynq.Client, db *sql.DB) (*MultipartHandler, error) {
	if db == nil {
		return nil, errors.New("db is required")
	}
	if queue == nil {
		return nil, errors.New("queue is required")
	}
	if cfg.S3BucketName == "" {
		return nil, errors.New("s3 bucket name is required")
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(
		context.Background(),
		awsconfig.WithRegion(cfg.AwsRegion),
	)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg)
	presigner := s3.NewPresignClient(client)
	return &MultipartHandler{
		bucket:    cfg.S3BucketName,
		client:    client,
		presigner: presigner,
		queue:     queue,
		db:        db,
	}, nil
}

type CreateMultipartUploadRequest struct {
	FileName string `json:"fileName"`
	FileType string `json:"fileType"`
	FileSize int64  `json:"fileSize"`
	Title    string `json:"title"`
}

type CreateMultipartUploadResponse struct {
	VideoID  string `json:"videoId"`
	Key      string `json:"key"`
	UploadID string `json:"uploadId"`
}

func (h *MultipartHandler) CreateMultipartUpload(w http.ResponseWriter, r *http.Request) {
	var req CreateMultipartUploadRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	if req.FileName == "" || req.FileType == "" || req.FileSize <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "fileName, fileType and fileSize are required",
		})
		return
	}

	if !strings.HasPrefix(req.FileType, "video/") {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Only video files are allowed",
		})
		return
	}

	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	/*
		This is acceptable, but the folder shape is a little noisy. A cleaner future shape would be:
		uploads/{videoID}/original.mp4
		previews/{videoID}/master.m3u8
		previews/{videoID}/stream_360p/...
		previews/{videoID}/stream_720p/...
		That would make S3 easier to reason about because the Video.id becomes the stable object namespace.
	*/

	key := fmt.Sprintf("uploads/%s/%s-%s", userID, uuid.NewString(), req.FileName)

	result, err := h.client.CreateMultipartUpload(r.Context(), &s3.CreateMultipartUploadInput{
		Bucket:      aws.String(h.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(req.FileType),
	})

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "internal server error",
		})
		return
	}

	uploadID := aws.ToString(result.UploadId)

	var videoID string
	/*
		both editorId and creatorId to userID.
		That is okay for solo-MVP testing, but it is not correct for real creator/editor workflow.
		Later creatorId should come from selected creator/workspace/invite relationship.
	*/
	err = h.db.QueryRowContext(
		r.Context(),
		`
		INSERT INTO "Video" (
			"editorId",
			"creatorId",
			"originalFileName",
			"originalS3Key",
			"originalMimeType",
			"originalSize",
			"uploadId",
			"title",
			"status",
			"updatedAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UPLOADING', CURRENT_TIMESTAMP)
		RETURNING "id"
		`,
		userID,
		userID,
		req.FileName,
		key,
		req.FileType,
		req.FileSize,
		uploadID,
		req.Title,
	).Scan(&videoID)

	if err != nil {
		_, abortErr := h.client.AbortMultipartUpload(r.Context(),
			&s3.AbortMultipartUploadInput{
				Bucket:   aws.String(h.bucket),
				Key:      aws.String(key),
				UploadId: aws.String(uploadID),
			})
		if abortErr != nil {
			log.Printf("failed to cleanup multipart upload after db insert error: %v", abortErr)
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to create video record",
		})
		return
	}
	log.Println("multipart upload is inserted into database")

	writeJSON(w, http.StatusOK, CreateMultipartUploadResponse{
		VideoID:  videoID,
		Key:      key,
		UploadID: uploadID,
	})
}

type SignPartRequest struct {
	VideoID    string `json:"videoId"`
	Key        string `json:"key"`
	UploadID   string `json:"uploadId"`
	PartNumber int32  `json:"partNumber"`
}

type SignPartResponse struct {
	SignedURL  string `json:"signedUrl"`
	PartNumber int32  `json:"partNumber"`
}

/*
Later improvement:
Support batch presigning for multiple part numbers and generate signed URLs concurrently
with a small errgroup limit. Current endpoint signs one part per request, so a goroutine
would add complexity without benefit.
*/
func (h *MultipartHandler) SignPart(w http.ResponseWriter, r *http.Request) {

	var req SignPartRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	if req.VideoID == "" || req.Key == "" || req.UploadID == "" || req.PartNumber <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "VideoId, key, uploadId and partNumber are required",
		})
		return
	}

	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	var videoID string

	err := h.db.QueryRowContext(r.Context(),
		`
	SELECT "id"
	FROM "Video"
	WHERE 
		"id" = $1
		AND "editorId" = $2
		AND "originalS3Key" = $3
		AND "uploadId" = $4
		AND "status" = 'UPLOADING'
	`,
		req.VideoID,
		userID,
		req.Key,
		req.UploadID,
	).Scan(&videoID)

	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Video not found",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to verify upload",
		})
		return
	}

	result, err := h.presigner.PresignUploadPart(r.Context(), &s3.UploadPartInput{
		Bucket:     aws.String(h.bucket),
		Key:        aws.String(req.Key),
		UploadId:   aws.String(req.UploadID),
		PartNumber: aws.Int32(req.PartNumber),
	}, s3.WithPresignExpires(10*time.Minute))

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to sign upload part",
		})
		return
	}

	log.Println("presign is done")

	writeJSON(w, http.StatusOK, SignPartResponse{
		SignedURL:  result.URL,
		PartNumber: req.PartNumber,
	})
}

type CompletedPartRequest struct {
	PartNumber int32  `json:"PartNumber"`
	ETag       string `json:"ETag"`
}

type CompleteMultipartUploadRequest struct {
	VideoID  string                 `json:"videoId"`
	Key      string                 `json:"key"`
	UploadID string                 `json:"uploadId"`
	Parts    []CompletedPartRequest `json:"parts"`
}

type CompleteMultipartUploadResponse struct {
	Message  string `json:"message"`
	Location string `json:"location"`
	Key      string `json:"key"`
	Bucket   string `json:"bucket"`
}

func (h *MultipartHandler) CompleteMultipartUpload(w http.ResponseWriter, r *http.Request) {
	var req CompleteMultipartUploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	if req.Key == "" || req.UploadID == "" || req.VideoID == "" || len(req.Parts) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "VideoId,key, uploadId and parts are required",
		})
		return
	}

	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	var videoID string

	err := h.db.QueryRowContext(
		r.Context(),
		`
	SELECT "id"
	FROM "Video"
	WHERE
		"id" = $1
		AND "editorId" = $2
		AND "originalS3Key" = $3
		AND "uploadId" = $4
		AND "status" = 'UPLOADING'
	`,
		req.VideoID,
		userID,
		req.Key,
		req.UploadID,
	).Scan(&videoID)

	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Video not found",
		})
		return
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to verify upload",
		})
		return
	}

	sort.Slice(req.Parts, func(i, j int) bool {
		return req.Parts[i].PartNumber < req.Parts[j].PartNumber
	})

	parts := make([]types.CompletedPart, 0, len(req.Parts))

	for _, part := range req.Parts {
		if part.PartNumber <= 0 || part.ETag == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "Each part must include PartNumber and ETag",
			})
			return
		}
		parts = append(parts, types.CompletedPart{
			PartNumber: aws.Int32(part.PartNumber),
			ETag:       aws.String(part.ETag),
		})
	}

	result, err := h.client.CompleteMultipartUpload(r.Context(), &s3.CompleteMultipartUploadInput{
		Bucket:   aws.String(h.bucket),
		Key:      aws.String(req.Key),
		UploadId: aws.String(req.UploadID),
		MultipartUpload: &types.CompletedMultipartUpload{
			Parts: parts,
		},
	})

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to complete multipart upload",
		})
		return
	}
	updateResult, err := h.db.ExecContext(r.Context(),
		`
	UPDATE "Video"
SET
    "status" = 'UPLOADED',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE
    "id" = $1
    AND "editorId" = $2
    AND "originalS3Key" = $3
    AND "uploadId" = $4
	AND "status" = 'UPLOADING'
	`,
		req.VideoID,
		userID,
		req.Key,
		req.UploadID,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Upload completed but failed to update video record",
		})
		return
	}

	rowsAffected, err := updateResult.RowsAffected()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to verify video update",
		})
		return
	}

	if rowsAffected != 1 {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Video not found",
		})
		return
	}

	log.Println("completed multi part upload")
	//TODO :- Later, better version is to queue videoId too, so worker can update:
	//TRANSCODING -> PREVIEW_READY / TRANSCODE_FAILED

	/*
		transcode task only receives req.Key.
		The worker cannot update DB status to TRANSCODING, PREVIEW_READY, or TRANSCODE_FAILED.
		Queue should include both:
		videoID
		sourceKey

	*/
	task := tasks.AddTranscodejob(req.VideoID, req.Key)
	if _, err := h.queue.Enqueue(task); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Upload completed but failed to queue transcode job",
		})
		return
	}
	log.Println("task to added to queue")

	writeJSON(w, http.StatusOK, CompleteMultipartUploadResponse{
		Message:  "Upload completed",
		Location: aws.ToString(result.Location),
		Key:      aws.ToString(result.Key),
		Bucket:   h.bucket,
	})

}

type AbortMultipartUploadRequest struct {
	VideoID  string `json:"videoId"`
	Key      string `json:"key"`
	UploadID string `json:"uploadId"`
}

type AbortMultipartUploadResponse struct {
	Message  string `json:"message"`
	Key      string `json:"key"`
	UploadID string `json:"uploadId"`
}

func (h *MultipartHandler) AbortMultipartUpload(w http.ResponseWriter, r *http.Request) {
	var req AbortMultipartUploadRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	if req.Key == "" || req.UploadID == "" || req.VideoID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "videoId, key and uploadId are required",
		})
		return
	}

	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	var videoID string

	err := h.db.QueryRowContext(
		r.Context(),
		`
		SELECT "id"
		FROM "Video"
		WHERE
			"id" = $1
			AND "editorId" = $2
			AND "originalS3Key" = $3
			AND "uploadId" = $4
			AND "status" = 'UPLOADING'
		`,
		req.VideoID,
		userID,
		req.Key,
		req.UploadID,
	).Scan(&videoID)
	
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Video not found",
		})
		return
	}
	
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to verify upload",
		})
		return
	}

	_, err = h.client.AbortMultipartUpload(r.Context(), &s3.AbortMultipartUploadInput{
		Bucket:   aws.String(h.bucket),
		Key:      aws.String(req.Key),
		UploadId: aws.String(req.UploadID),
	})

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to abort multipart upload",
		})
		return
	}

	result, err := h.db.ExecContext(
		r.Context(),
		`
		UPDATE "Video"
		SET
			"status" = 'UPLOAD_ABORTED',
			"updatedAt" = CURRENT_TIMESTAMP
		WHERE
			"id" = $1
			AND "editorId" = $2
			AND "originalS3Key" = $3
			AND "uploadId" = $4
			AND "status" = 'UPLOADING'
		`,
		req.VideoID,
		userID,
		req.Key,
		req.UploadID,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Upload aborted but failed to update video record",
		})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to verify video update",
		})
		return
	}

	if rowsAffected != 1 {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Video not found",
		})
		return
	}

	log.Println("aborted the upload")

	writeJSON(w, http.StatusOK, AbortMultipartUploadResponse{
		Message:  "Multipart upload aborted",
		Key:      req.Key,
		UploadID: req.UploadID,
	})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	//helper is fine for MVP. Later you may want to log JSON encoding errors, but this is not urgent.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
