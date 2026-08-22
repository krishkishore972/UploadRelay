package main

import (
	"context"
	"log"

	"go-api/internal/config"
	"go-api/internal/queue"

	"go-api/internal/tasks"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/hibiken/asynq"
)

func main() {
	cfg := config.MustLoad()
	
	awscfg,err := awsconfig.LoadDefaultConfig(
		context.Background(),
		awsconfig.WithRegion(cfg.AwsRegion),
	)
	
	if err != nil {
		log.Fatal(err)
	}
	
	processor := &tasks.Processor{
		S3: s3.NewFromConfig(awscfg),
		Bucket: cfg.S3BucketName,
	}
	
	srv := queue.NewAsynqServer(cfg)
	log.Println("worker server is started")
	
	mux := asynq.NewServeMux()
	mux.HandleFunc(tasks.TypeVideoTranscode,processor.HandleVideoTranscode)


	log.Println("asynq worker listening for video:transcode")
	if err := srv.Run(mux); err != nil {
		log.Fatal(err)
	}
}