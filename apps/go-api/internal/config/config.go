package config

import (
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	Port string
	Env  string
	DatabaseUrl string
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
	return Config{
		Port: port,
		Env: env,
		DatabaseUrl: databaseurl,
	}
}