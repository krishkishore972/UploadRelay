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

func AddTranscodejob(videoID, sourceKey string) *asynq.Task {
	payload := VideoTranscodePayload{
		VideoID:   videoID,
		SourceKey: sourceKey,
	}
	data,err := json.Marshal(payload)
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