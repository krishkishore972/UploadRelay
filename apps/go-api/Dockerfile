# Build stage
FROM golang:1.26-bookworm AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -tags netgo -ldflags="-s -w" -o /worker ./cmd/worker


# Runtime stage
FROM debian:bookworm-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /worker /worker

ENTRYPOINT ["/worker"]