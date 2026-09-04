package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"path"

	"github.com/hibiken/asynq"
)

func (p *Processor) HandleVideoTranscode(ctx context.Context, t *asynq.Task) error {
	var payload VideoTranscodePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}

	if payload.VideoID == "" {
		return fmt.Errorf("video_id is required")
	}

	if payload.SourceKey == "" {
		return fmt.Errorf("source_key is required")
	}

	result, err := p.DB.ExecContext(
		ctx,
		`
		UPDATE "Video"
		SET
			"status" = 'TRANSCODING',
			"updatedAt" = CURRENT_TIMESTAMP
		WHERE
			"id" = $1
			AND "originalS3Key" = $2
			AND "status" = 'UPLOADED'
		`,
		payload.VideoID,
		payload.SourceKey,
	)
	if err != nil {
		return fmt.Errorf("mark video transcoding: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("verify transcoding update: %w", err)
	}

	if rowsAffected != 1 {
		return fmt.Errorf("video not ready for transcoding: %s", payload.VideoID)
	}

	log.Printf("transcoding %s", payload.SourceKey)

	if err := p.TranscodeVideo(ctx, payload.SourceKey); err != nil {
		_, updateErr := p.DB.ExecContext(
			context.Background(),
			`
			UPDATE "Video"
			SET
				"status" = 'TRANSCODE_FAILED',
				"updatedAt" = CURRENT_TIMESTAMP
			WHERE
				"id" = $1
				AND "originalS3Key" = $2
			`,
			payload.VideoID,
			payload.SourceKey,
		)
		if updateErr != nil {
			log.Printf("failed to mark transcode failed for video %s: %v", payload.VideoID, updateErr)
		}

		return fmt.Errorf("transcode video: %w", err)
	}

	previewPrefix := createPreviewPrefix(payload.SourceKey)
	masterKey := path.Join(previewPrefix, "master.m3u8")

	_, err = p.DB.ExecContext(
		ctx,
		`
		UPDATE "Video"
		SET
			"status" = 'PREVIEW_READY',
			"previewPrefix" = $3,
			"masterPlaylistKey" = $4,
			"updatedAt" = CURRENT_TIMESTAMP
		WHERE
			"id" = $1
			AND "originalS3Key" = $2
			AND "status" = 'TRANSCODING'
		`,
		payload.VideoID,
		payload.SourceKey,
		previewPrefix,
		masterKey,
	)
	if err != nil {
		return fmt.Errorf("mark preview ready: %w", err)
	}

	return nil
}
