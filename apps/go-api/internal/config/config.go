package config

import (
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	Port string
	Env  string
	DatabaseUrl string
	AwsRegion string
	AwsAccessKey string
	AwsSecretAccessKey string
	S3BucketName string
}

// must pattern && fail fast
func MustLoad() Config {
	godotenv.Load()
	port := os.Getenv("PORT")
	if port == "" {
		panic("PORT is required")
	}
	env := os.Getenv("ENV");
	if env == "" {
		panic("ENV is required")
	}
	databaseurl := os.Getenv("DATABASE_URL");
	if databaseurl == "" {
		panic("DATABASE_URL is required")
	}
	awsRegion := os.Getenv("AWS_REGION");
	if awsRegion == "" {
		panic("AWS_REGION is required")
	}
	awsAccessKey := os.Getenv("AWS_ACCESS_KEY");
	if awsAccessKey == "" {
		panic("AWS_ACCESS_KEY is required")
	}
	awsSecretAccessKey := os.Getenv("AWS_SECRET_ACCESS_KEY");
	if awsSecretAccessKey == "" {
		panic("AWS_SECRET_ACCESS_KEY is required")
	}
	s3BucketName := os.Getenv("S3_BUCKET_NAME");
	if s3BucketName == "" {
		panic("S3_BUCKET_NAME is required")
	}
	return Config{
		Port: port,
		Env: env,
		DatabaseUrl: databaseurl,
		AwsRegion: awsRegion,
		AwsAccessKey: awsAccessKey,
		AwsSecretAccessKey: awsSecretAccessKey,
		S3BucketName: s3BucketName,
	}
}