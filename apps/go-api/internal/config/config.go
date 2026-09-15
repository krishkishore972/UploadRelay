package config

import (
	"github.com/joho/godotenv"
	"os"
)

type Config struct {
	Port               string
	Env                string
	DatabaseUrl        string
	AwsRegion          string
	AwsAccessKey       string
	AwsSecretAccessKey string
	S3BucketName       string
	RedisUrl           string
	GoJWTSecret        string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string
	WebAppURL          string
	TokenEncryptionKey string
}

// must pattern && fail fast
func MustLoad() Config {
	godotenv.Load()
	port := os.Getenv("PORT")
	if port == "" {
		panic("PORT is required")
	}
	env := os.Getenv("ENV")
	if env == "" {
		panic("ENV is required")
	}
	databaseurl := os.Getenv("DATABASE_URL")
	if databaseurl == "" {
		panic("DATABASE_URL is required")
	}
	awsRegion := os.Getenv("AWS_REGION")
	if awsRegion == "" {
		panic("AWS_REGION is required")
	}
	awsAccessKey := os.Getenv("AWS_ACCESS_KEY")
	if awsAccessKey == "" {
		panic("AWS_ACCESS_KEY is required")
	}
	awsSecretAccessKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	if awsSecretAccessKey == "" {
		panic("AWS_SECRET_ACCESS_KEY is required")
	}
	s3BucketName := os.Getenv("S3_BUCKET_NAME")
	if s3BucketName == "" {
		panic("S3_BUCKET_NAME is required")
	}
	redisUrl := os.Getenv("REDIS_URL")
	if redisUrl == "" {
		panic("REDIS_URL is required")
	}
	goJWTString := os.Getenv("GO_JWT_SECRET")
	if goJWTString == "" {
		panic("GO_JWT_SECRET is required")
	}
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	if googleClientID == "" {
		panic("GOOGLE_CLIENT_ID is required")
	}

	googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if googleClientSecret == "" {
		panic("GOOGLE_CLIENT_SECRET is required")
	}

	googleRedirectURI := os.Getenv("GOOGLE_REDIRECT_URI")
	if googleRedirectURI == "" {
		panic("GOOGLE_REDIRECT_URI is required")
	}

	webAppURL := os.Getenv("WEB_APP_URL")
	if webAppURL == "" {
		panic("WEB_APP_URL is required")
	}

	tokenEncryptionKey := os.Getenv("TOKEN_ENCRYPTION_KEY")
	if tokenEncryptionKey == "" {
		panic("TOKEN_ENCRYPTION_KEY is required")
	}
	return Config{
		Port:               port,
		Env:                env,
		DatabaseUrl:        databaseurl,
		AwsRegion:          awsRegion,
		AwsAccessKey:       awsAccessKey,
		AwsSecretAccessKey: awsSecretAccessKey,
		S3BucketName:       s3BucketName,
		RedisUrl:           redisUrl,
		GoJWTSecret:        goJWTString,
		GoogleClientID:     googleClientID,
		GoogleClientSecret: googleClientSecret,
		GoogleRedirectURI:  googleRedirectURI,
		WebAppURL:          webAppURL,
		TokenEncryptionKey: tokenEncryptionKey,
	}
}
