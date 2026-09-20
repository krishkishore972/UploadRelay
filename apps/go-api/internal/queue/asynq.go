package queue

import (
	"go-api/internal/config"
	"time"

	"github.com/hibiken/asynq"
)

func redisOpt(cfg config.Config) asynq.RedisConnOpt {
	opt, err := asynq.ParseRedisURI(cfg.RedisUrl)
	if err != nil {
		panic(err)
	}
	return opt
}

func NewAsynqClient(cfg config.Config) *asynq.Client {
	return asynq.NewClient(redisOpt(cfg))
}
func NewAsynqServer(cfg config.Config) *asynq.Server {
	return asynq.NewServer(redisOpt(cfg), asynq.Config{
		Concurrency:              1,
		TaskCheckInterval:        30 * time.Second,
		HealthCheckInterval:      5 * time.Minute,
		DelayedTaskCheckInterval: 5 * time.Minute,
		JanitorInterval:          10 * time.Minute,
	})
}
