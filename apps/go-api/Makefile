BIN_DIR=bin
BIN_NAME=main
.PHONY: run run-worker build build-worker migrate-up migrate-down migrate-version
run:
	@go run cmd/server/main.go

run-worker:
	@go run cmd/worker/main.go

build:
	@if not exist $(BIN_DIR) mkdir $(BIN_DIR)
	@go build -o $(BIN_DIR)/$(BIN_NAME)

build-worker:
	@if not exist $(BIN_DIR) mkdir $(BIN_DIR)
	@go build -o $(BIN_DIR)/worker ./cmd/worker

migrate-up:
	@go run cmd/migrate/main.go up

migrate-down:
	@go run cmd/migrate/main.go down

migrate-version:
	@go run cmd/migrate/main.go version`
