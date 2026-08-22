package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

func (p *Processor)HandleVideoTranscode(ctx context.Context, t *asynq.Task) error {
	var payload VideoTranscodePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}
	if payload.SourceKey == "" {
		return fmt.Errorf("source_key is required")
	}

	log.Printf("transcoding %s", payload.SourceKey)
	// download from S3, ffmpeg HLS, upload previews/ — same as apps/worker/services/transcodeVideo.ts
	return p.TranscodeVideo(ctx, payload.SourceKey)
}