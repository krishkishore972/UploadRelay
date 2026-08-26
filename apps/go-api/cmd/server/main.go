package main

import (
	"go-api/internal/config"
	"go-api/internal/handlers"
	"go-api/internal/middleware"
	"go-api/internal/queue"
	"log"
	"net/http"
	"time"
)

func main() {
	log.Println("starting server...")
	cfg := config.MustLoad()
	asynqClient := queue.NewAsynqClient(cfg)
	defer asynqClient.Close()
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handlers.Health)
	multipartHandler, err := handlers.NewMultipartHandler(cfg,asynqClient)
	if err != nil {
		log.Fatalf("failed to create multipart handler: %v", err)
	}

	mux.Handle(
		"POST /uploads/create",
		middleware.AuthMiddleware(cfg.GoJWTSecret, http.HandlerFunc(multipartHandler.CreateMultipartUpload)),
	)
	mux.Handle(
		"POST /uploads/sign-part",
		middleware.AuthMiddleware(cfg.GoJWTSecret, http.HandlerFunc(multipartHandler.SignPart)),
	)
	mux.Handle(
		"POST /uploads/complete",
		middleware.AuthMiddleware(cfg.GoJWTSecret, http.HandlerFunc(multipartHandler.CompleteMultipartUpload)),
	)
	mux.Handle(
		"POST /uploads/abort",
		middleware.AuthMiddleware(cfg.GoJWTSecret, http.HandlerFunc(multipartHandler.AbortMultipartUpload)),
	)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      withCORS(mux),
		ReadTimeout:  100 * time.Second,
		WriteTimeout: 100 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	log.Printf("server is listening on %s", server.Addr)

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

