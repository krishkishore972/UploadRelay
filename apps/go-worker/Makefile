BIN_DIR=bin
BIN_NAME=main
.PHONY: run build
run:
	@go run .

build:
	@if not exist $(BIN_DIR) mkdir $(BIN_DIR)
	@go build -o $(BIN_DIR)/$(BIN_NAME)