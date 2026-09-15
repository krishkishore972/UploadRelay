package tasks

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/hibiken/asynq"
	"golang.org/x/oauth2"
	"google.golang.org/api/googleapi"
	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
)

func (p *Processor) HandleVideoPublish(ctx context.Context, t *asynq.Task) error {
	log.Printf("publish task started")

	var payload VideoPublishPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		log.Printf("publish task payload decode failed: %v", err)
		return fmt.Errorf("invalid publish payload: %w", err)
	}
	log.Printf("publish task payload decoded: job_id=%s video_id=%s", payload.JobID, payload.VideoID)

	if payload.JobID == "" || payload.VideoID == "" {
		log.Printf("publish task rejected: missing job_id or video_id")
		return errors.New("job_id and video_id are required")
	}

	log.Printf("loading publish job: job_id=%s video_id=%s", payload.JobID, payload.VideoID)
	job, err := p.loadPublishJob(ctx, payload.JobID, payload.VideoID)
	if err != nil {
		log.Printf("load publish job failed: job_id=%s video_id=%s error=%v", payload.JobID, payload.VideoID, err)
		return err
	}
	log.Printf("publish job loaded: job_id=%s video_id=%s s3_key=%s title=%q privacy=%s", job.JobID, job.VideoID, job.OriginalS3Key, job.Title, job.Privacy)

	log.Printf("marking publish job running: job_id=%s video_id=%s", job.JobID, job.VideoID)
	if err := p.markPublishRunning(ctx, job.JobID, job.VideoID); err != nil {
		log.Printf("mark publish job running failed: job_id=%s video_id=%s error=%v", job.JobID, job.VideoID, err)
		return err
	}
	log.Printf("publish job marked running: job_id=%s video_id=%s", job.JobID, job.VideoID)

	log.Printf("starting youtube upload: job_id=%s video_id=%s s3_key=%s", job.JobID, job.VideoID, job.OriginalS3Key)
	youtubeVideoID, youtubeURL, err := p.uploadToYouTube(ctx, job)
	if err != nil {
		log.Printf("youtube upload failed: job_id=%s video_id=%s error=%v", job.JobID, job.VideoID, err)
		if markErr := p.markPublishFailed(context.Background(), job.JobID, job.VideoID, err.Error()); markErr != nil {
			log.Printf("mark publish job failed state failed: job_id=%s video_id=%s error=%v", job.JobID, job.VideoID, markErr)
		}
		return fmt.Errorf("upload to youtube: %w", err)
	}
	log.Printf("youtube upload completed: job_id=%s video_id=%s youtube_video_id=%s", job.JobID, job.VideoID, youtubeVideoID)

	log.Printf("marking publish job completed: job_id=%s video_id=%s", job.JobID, job.VideoID)
	if err := p.markPublishCompleted(ctx, job.JobID, job.VideoID, youtubeVideoID, youtubeURL); err != nil {
		log.Printf("mark publish job completed failed: job_id=%s video_id=%s error=%v", job.JobID, job.VideoID, err)
		return err
	}
	log.Printf("publish task completed: job_id=%s video_id=%s youtube_video_id=%s", job.JobID, job.VideoID, youtubeVideoID)

	return nil
}

type publishJobData struct {
	JobID                 string
	VideoID               string
	OriginalS3Key         string
	OriginalMimeType      sql.NullString
	Title                 string
	Description           sql.NullString
	Privacy               string
	RefreshTokenEncrypted string
}

func (p *Processor) loadPublishJob(ctx context.Context, jobID, videoID string) (*publishJobData, error) {
	var job publishJobData

	err := p.DB.QueryRowContext(ctx,
		`
		SELECT
			pj."id",
			v."id",
			v."originalS3Key",
			v."originalMimeType",
			pj."title",
			pj."description",
			pj."privacy",
			yc."refreshTokenEncrypted"
		FROM "PublishJob" pj
		JOIN "Video" v ON v."id" = pj."videoId"
		JOIN "YouTubeConnection" yc ON yc."id" = pj."youtubeConnectionId"
		WHERE pj."id" = $1
		  AND v."id" = $2
		  AND pj."status" = 'PENDING'
		  AND v."status" = 'PUBLISHING'
		`,
		jobID,
		videoID,
	).Scan(
		&job.JobID,
		&job.VideoID,
		&job.OriginalS3Key,
		&job.OriginalMimeType,
		&job.Title,
		&job.Description,
		&job.Privacy,
		&job.RefreshTokenEncrypted,
	)

	if err != nil {
		return nil, fmt.Errorf("load publish job: %w", err)
	}

	return &job, nil
}

func (p *Processor) markPublishRunning(ctx context.Context, jobID, videoID string) error {
	result, err := p.DB.ExecContext(ctx,
		`
		UPDATE "PublishJob"
		SET "status" = 'RUNNING',
		    "startedAt" = COALESCE("startedAt", CURRENT_TIMESTAMP),
		    "updatedAt" = CURRENT_TIMESTAMP
		WHERE "id" = $1
		  AND "videoId" = $2
		  AND "status" = 'PENDING'
		`,
		jobID,
		videoID,
	)
	if err != nil {
		return fmt.Errorf("mark publish running: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("verify publish running: %w", err)
	}

	if rows != 1 {
		return fmt.Errorf("publish job is not pending: %s", jobID)
	}

	return nil
}

func (p *Processor) uploadToYouTube(ctx context.Context, job *publishJobData) (string, string, error) {
	log.Printf("decrypting youtube refresh token: job_id=%s", job.JobID)
	refreshToken, err := p.TokenCipher.Decrypt(job.RefreshTokenEncrypted)
	if err != nil {
		return "", "", fmt.Errorf("decrypt refresh token: %w", err)
	}
	log.Printf("youtube refresh token decrypted: job_id=%s", job.JobID)

	token := &oauth2.Token{
		RefreshToken: refreshToken,
		Expiry:       time.Now().Add(-time.Hour),
	}

	client := p.YouTubeOAuth.Client(ctx, token)
	log.Printf("youtube oauth client created: job_id=%s", job.JobID)

	service, err := youtube.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return "", "", fmt.Errorf("create youtube service: %w", err)
	}
	log.Printf("youtube service created: job_id=%s", job.JobID)

	log.Printf("reading original video from s3: bucket=%s key=%s", p.Bucket, job.OriginalS3Key)
	object, err := p.S3.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(p.Bucket),
		Key:    aws.String(job.OriginalS3Key),
	})
	if err != nil {
		return "", "", fmt.Errorf("get original from s3: %w", err)
	}
	defer object.Body.Close()
	log.Printf("original video opened from s3: job_id=%s key=%s", job.JobID, job.OriginalS3Key)

	description := ""
	if job.Description.Valid {
		description = job.Description.String
	}

	video := &youtube.Video{
		Snippet: &youtube.VideoSnippet{
			Title:       job.Title,
			Description: description,
		},
		Status: &youtube.VideoStatus{
			PrivacyStatus: strings.ToLower(job.Privacy),
		},
	}
	log.Printf("youtube metadata prepared: job_id=%s title=%q privacy=%s mime_type=%s", job.JobID, job.Title, strings.ToLower(job.Privacy), job.OriginalMimeType.String)

	call := service.Videos.Insert([]string{"snippet", "status"}, video)

	if job.OriginalMimeType.Valid && job.OriginalMimeType.String != "" {
		call.Media(
			object.Body,
			googleapi.ContentType(job.OriginalMimeType.String),
			googleapi.ChunkSize(8*1024*1024),
		)
	} else {
		call.Media(
			object.Body,
			googleapi.ChunkSize(8*1024*1024),
		)
	}

	uploaded, err := call.Do()
	if err != nil {
		return "", "", fmt.Errorf("youtube insert video: %w", err)
	}
	log.Printf("youtube api returned uploaded video: job_id=%s youtube_video_id=%s", job.JobID, uploaded.Id)

	youtubeURL := "https://www.youtube.com/watch?v=" + uploaded.Id

	return uploaded.Id, youtubeURL, nil
}

func (p *Processor) markPublishCompleted(ctx context.Context, jobID, videoID, youtubeVideoID, youtubeURL string) error {
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx,
		`
		UPDATE "PublishJob"
		SET "status" = 'COMPLETED',
		    "youtubeVideoId" = $3,
		    "youtubeUrl" = $4,
		    "completedAt" = CURRENT_TIMESTAMP,
		    "updatedAt" = CURRENT_TIMESTAMP
		WHERE "id" = $1
		  AND "videoId" = $2
		`,
		jobID,
		videoID,
		youtubeVideoID,
		youtubeURL,
	)
	if err != nil {
		return fmt.Errorf("mark publish job completed: %w", err)
	}

	_, err = tx.ExecContext(ctx,
		`
		UPDATE "Video"
		SET "status" = 'PUBLISHED',
		    "updatedAt" = CURRENT_TIMESTAMP
		WHERE "id" = $1
		`,
		videoID,
	)
	if err != nil {
		return fmt.Errorf("mark video published: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit publish completion: %w", err)
	}

	return nil
}

func (p *Processor) markPublishFailed(ctx context.Context, jobID, videoID, message string) error {
	_, err := p.DB.ExecContext(ctx,
		`
		UPDATE "PublishJob"
		SET "status" = 'FAILED',
		    "errorMessage" = $3,
		    "failedAt" = CURRENT_TIMESTAMP,
		    "updatedAt" = CURRENT_TIMESTAMP
		WHERE "id" = $1
		  AND "videoId" = $2
		`,
		jobID,
		videoID,
		message,
	)
	if err != nil {
		return fmt.Errorf("mark publish job failed: %w", err)
	}

	_, err = p.DB.ExecContext(ctx,
		`
		UPDATE "Video"
		SET "status" = 'PUBLISH_FAILED',
		    "updatedAt" = CURRENT_TIMESTAMP
		WHERE "id" = $1
		`,
		videoID,
	)
	if err != nil {
		return fmt.Errorf("mark video publish failed: %w", err)
	}

	return nil
}
