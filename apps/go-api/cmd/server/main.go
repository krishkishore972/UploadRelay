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

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}
	
	log.Printf("server is listening on %s",server.Addr)

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server failed: %v",err)
	}
}
