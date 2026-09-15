package tasks

import (
	"encoding/json"
	"time"

	"github.com/hibiken/asynq"
)

type VideoTranscodePayload struct {
	VideoID   string `json:"video_id"`
	SourceKey string `json:"source_key"`
}
type VideoPublishPayload struct {
	JobID   string `json:"job_id"`
	VideoID string `json:"video_id"`
}

func AddTranscodejob(videoID, sourceKey string) *asynq.Task {
	payload := VideoTranscodePayload{
		VideoID:   videoID,
		SourceKey: sourceKey,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}
	return asynq.NewTask(
		TypeVideoTranscode,
		data,
		asynq.MaxRetry(5),
		asynq.Timeout(20*time.Minute),
	)
}

func AddPublishJob(jobID, videoID string) *asynq.Task {
	payload := VideoPublishPayload{
		JobID:   jobID,
		VideoID: videoID,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}

	return asynq.NewTask(
		TypeVideoPublish,
		data,
		asynq.MaxRetry(3),
		asynq.Timeout(6*time.Hour),
	)
}
