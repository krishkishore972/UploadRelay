package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"go-api/internal/config"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type MultipartHandler struct {
	bucket    string
	client    *s3.Client
	presigner *s3.PresignClient
}

func NewMultipartHandler(cfg config.Config) (*MultipartHandler, error) {
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
	}, nil
}

/*
Frontend sends:
{
  "fileName": "video.mp4",
  "fileType": "video/mp4"
}
*/

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

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

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
