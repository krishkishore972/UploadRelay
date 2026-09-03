package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"go-api/internal/config"
	"go-api/internal/tasks"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
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

func NewMultipartHandler(cfg config.Config,queue *asynq.Client,db *sql.DB) (*MultipartHandler, error) {
	awsCfg, err := awsconfig.LoadDefaultConfig(
		context.Background(),
		awsconfig.WithRegion(cfg.AwsRegion),
	)

	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(awsCfg)
	presigner := s3.NewPresignClient(client)
	return &MultipartHandler{
		bucket:    cfg.S3BucketName,
		client:    client,
		presigner: presigner,
		queue: queue,
		db: db,
	}, nil
}

type CreateMultipartUploadRequest struct {
	FileName string `json:"fileName"`
	FileType string `json:"fileType"`
	FileSize int64  `json:"fileSize"`
}

type CreateMultipartUploadResponse struct {
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

	key := fmt.Sprintf("uploads/%d-%s", time.Now().UnixMilli(), req.FileName)

	result, err := h.client.CreateMultipartUpload(r.Context(), &s3.CreateMultipartUploadInput{
		Bucket:      aws.String(h.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(req.FileType),
	})

	log.Println("create multipart upload is success")

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to create multipart upload",
		})
		return
	}

	writeJSON(w, http.StatusOK, CreateMultipartUploadResponse{
		Key:      key,
		UploadID: aws.ToString(result.UploadId),
	})
}

type SignPartRequest struct {
	Key        string `json:"key"`
	UploadID   string `json:"uploadId"`
	PartNumber int32  `json:"partNumber"`
}

type SignPartResponse struct {
	SignedURL  string `json:"signedUrl"`
	PartNumber int32  `json:"partNumber"`
}

func (h *MultipartHandler) SignPart(w http.ResponseWriter, r *http.Request) {
	var req SignPartRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	if req.Key == "" || req.UploadID == "" || req.PartNumber <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "key, uploadId and partNumber are required",
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

	if req.Key == "" || req.UploadID == "" || len(req.Parts) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "key, uploadId and parts are required",
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
	log.Println("completed multi part upload")
	task := tasks.AddTranscodejob(req.Key)
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

	if req.Key == "" || req.UploadID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "key and uploadId are required",
		})
		return
	}

	_, err := h.client.AbortMultipartUpload(r.Context(), &s3.AbortMultipartUploadInput{
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

	log.Println("aborted the upload")

	writeJSON(w, http.StatusOK, AbortMultipartUploadResponse{
		Message:  "Multipart upload aborted",
		Key:      req.Key,
		UploadID: req.UploadID,
	})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
