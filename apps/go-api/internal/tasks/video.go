package tasks

import (
	"encoding/json"

	"github.com/hibiken/asynq"
)

type VideoTranscodePayload struct {
	SourceKey string `json:"source_key"`
}

func AddTranscodejob(sourceKey string) *asynq.Task {
	payload := VideoTranscodePayload{
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
	)
}