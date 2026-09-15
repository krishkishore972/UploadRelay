package main

import (
	"context"
	"log"

	"go-api/internal/config"
	"go-api/internal/db"
	"go-api/internal/queue"

	"go-api/internal/tasks"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/hibiken/asynq"

	tokencrypto "go-api/internal/crypto"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/youtube/v3"
)

func main() {
	log.Println("worker is running")
	cfg := config.MustLoad()

	database, err := db.Connect(cfg.DatabaseUrl)

	if err != nil {
		log.Fatalf("failed to connect db : %v", err)
	}
	defer database.Close()

	awscfg, err := awsconfig.LoadDefaultConfig(
		context.Background(),
		awsconfig.WithRegion(cfg.AwsRegion),
	)

	if err != nil {
		log.Fatal(err)
	}

	cipher, err := tokencrypto.NewTokenCipher(cfg.TokenEncryptionKey)
	if err != nil {
		log.Fatalf("failed to create token cipher: %v", err)
	}

	youtubeOAuth := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURI,
		Scopes: []string{
			youtube.YoutubeUploadScope,
			youtube.YoutubeReadonlyScope,
		},
		Endpoint: google.Endpoint,
	}

	processor := &tasks.Processor{
		S3:           s3.NewFromConfig(awscfg),
		Bucket:       cfg.S3BucketName,
		DB:           database,
		YouTubeOAuth: youtubeOAuth,
		TokenCipher:  cipher,
	}

	srv := queue.NewAsynqServer(cfg)
	log.Println("worker server is started")

	mux := asynq.NewServeMux()
	mux.HandleFunc(tasks.TypeVideoTranscode, processor.HandleVideoTranscode)
	mux.HandleFunc(tasks.TypeVideoPublish, processor.HandleVideoPublish)

	log.Println("asynq worker listening for video:transcode")
	if err := srv.Run(mux); err != nil {
		log.Fatal(err)
	}
}
