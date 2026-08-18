package handlers

import (
	"encoding/json"
	"net/http"
)

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "Application/json")
	w.WriteHeader(http.StatusOK)
	msg := map[string]string{
		"message": "healthy",
	}
	json.NewEncoder(w).Encode(msg)
}