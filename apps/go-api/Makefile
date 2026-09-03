BIN_DIR=bin
BIN_NAME=main
.PHONY: run build
run:
	@go run cmd/server/main.go

build:
	@if not exist $(BIN_DIR) mkdir $(BIN_DIR)
	@go build -o $(BIN_DIR)/$(BIN_NAME)

migrate-up:
	@go run cmd/migrate/main.go up

migrate-down:
	@go run cmd/migrate/main.go down

migrate-reset:
	@go run cmd/migrate/main.go reset

migrate-status:
	@go run cmd/migrate/main.go status

