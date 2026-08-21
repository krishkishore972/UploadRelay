package queue

import (
	"go-api/internal/config"

	"github.com/hibiken/asynq"
)

func NewAsynqClient(cfg config.Config) *asynq.Client {
	return asynq.NewClient(
		asynq.RedisClientOpt{
			Addr: cfg.RedisUrl,
		},
	)
}

func NewAsynqServer(cfg config.Config) *asynq.Server {
	return asynq.NewServer(
		asynq.RedisClientOpt{
			Addr: cfg.RedisUrl,
		},
		asynq.Config{
			Concurrency: 10,
		},
	)
}


