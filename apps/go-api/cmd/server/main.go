package main

import (
	"fmt"
	"go-api/internal/config"
	"go-api/internal/handlers"
	"log"
	"net/http"
	"time"
)

func main() {
	cfg := config.MustLoad()

	fmt.Println("starting server...")
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handlers.Health)
	multipartHandler, err := handlers.NewMultipartHandler(cfg)
	if err != nil {
		log.Fatalf("failed to create multipart handler: %v", err)
	}

	mux.HandleFunc("POST /uploads/create", multipartHandler.CreateMultipartUpload)
	mux.HandleFunc("POST /uploads/sign-part", multipartHandler.SignPart)
	mux.HandleFunc("POST /uploads/complete", multipartHandler.CompleteMultipartUpload)
	mux.HandleFunc("POST /uploads/abort", multipartHandler.AbortMultipartUpload)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      withCORS(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

