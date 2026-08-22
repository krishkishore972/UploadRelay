package queue

import (
	"go-api/internal/config"

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
		Concurrency: 1,
	})
}


