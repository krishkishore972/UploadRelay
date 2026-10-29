// Command requeue re-runs the transcode pipeline for videos that already
// finished uploading but ended in TRANSCODE_FAILED (e.g. ffmpeg was missing).
// The original file stays in S3, so nothing needs to be uploaded again.
package main

import (
	"context"
	"flag"
	"log"
	"time"

	"go-api/internal/config"
	"go-api/internal/db"
	"go-api/internal/queue"
	"go-api/internal/tasks"
)

func main() {
	allFailed := flag.Bool("all-failed", false, "requeue every video stuck in TRANSCODE_FAILED")
	flag.Parse()

	videoID := flag.Arg(0)
	if !*allFailed && videoID == "" {
		log.Fatal("usage: go run ./cmd/requeue [-all-failed] [videoID]")
	}

	cfg := config.MustLoad()

	database, err := db.Connect(cfg.DatabaseUrl)
	if err != nil {
		log.Fatalf("failed to connect db: %v", err)
	}
	defer database.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	query := `SELECT "id", "originalS3Key" FROM "Video" WHERE "status" = 'TRANSCODE_FAILED'`
	var args []any
	if !*allFailed {
		query += ` AND "id" = $1`
		args = append(args, videoID)
	}

	rows, err := database.QueryContext(ctx, query, args...)
	if err != nil {
		log.Fatalf("query videos: %v", err)
	}

	type candidate struct {
		id        string
		sourceKey string
	}

	var candidates []candidate
	for rows.Next() {
		var c candidate
		if err := rows.Scan(&c.id, &c.sourceKey); err != nil {
			rows.Close()
			log.Fatalf("scan video: %v", err)
		}
		candidates = append(candidates, c)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		log.Fatalf("read videos: %v", err)
	}
	rows.Close()

	if len(candidates) == 0 {
		log.Println("nothing to requeue")
		return
	}

	client := queue.NewAsynqClient(cfg)
	defer client.Close()

	for _, c := range candidates {
		// The transcode handler only picks up videos in UPLOADED, so reset first.
		res, err := database.ExecContext(
			ctx,
			`
			UPDATE "Video"
			SET "status" = 'UPLOADED', "updatedAt" = CURRENT_TIMESTAMP
			WHERE "id" = $1 AND "status" = 'TRANSCODE_FAILED'
			`,
			c.id,
		)
		if err != nil {
			log.Printf("reset %s: %v", c.id, err)
			continue
		}
		if n, _ := res.RowsAffected(); n != 1 {
			log.Printf("skip %s: status changed while requeueing", c.id)
			continue
		}

		task := tasks.AddTranscodejob(c.id, c.sourceKey)
		info, err := client.Enqueue(task)
		if err != nil {
			log.Printf("enqueue %s: %v", c.id, err)
			continue
		}

		log.Printf("requeued %s as task %s", c.id, info.ID)
	}
}
