package tasks

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type Processor struct {
	S3     *s3.Client
	Bucket string
	DB     *sql.DB
}

/*
S3:
uploads/videos/movie.mp4
        │
        │ downloadFromS3()
        ▼
/tmp/uploadrelay/xyz/movie.mp4
        │
        │ createHLSPreview()
        ▼
hls/
├── master.m3u8
├── stream_360p/
│   ├── index.m3u8
│   ├── segment_000.ts
│   ├── segment_001.ts
│   └── ...
│
└── stream_720p/
    ├── index.m3u8
    ├── segment_000.ts
    ├── segment_001.ts
    └── ...
        │
        │ uploadDirToS3()
        ▼
S3:
previews/...
*/

func (p *Processor) TranscodeVideo(ctx context.Context, sourceKey string) error {
	if sourceKey == "" {
		return fmt.Errorf("source_key is required")
	}

	workDir := filepath.Join(os.TempDir(), "uploadRelay", uuid.NewString())
	inputPath := filepath.Join(workDir, fileNameFromKey(sourceKey))
	hlsDir := filepath.Join(workDir, "hls")
	previewPrefix := createPreviewPrefix(sourceKey)
	masterKey := path.Join(previewPrefix, "master.m3u8")

	if err := os.MkdirAll(filepath.Join(hlsDir, "stream_360p"), 0o755); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Join(hlsDir, "stream_720p"), 0o755); err != nil {
		return err
	}
	defer os.RemoveAll(workDir)

	log.Printf("downloading %s", sourceKey)

	if err := p.downloadFromS3(ctx, sourceKey, inputPath); err != nil {
		return err
	}

	log.Println("running ffmpeg")

	if err := createHLSPreview(ctx, inputPath, hlsDir); err != nil {
		return err
	}

	log.Printf("uploading HLS to %s", previewPrefix)

	if err := p.uploadDirToS3(ctx, hlsDir, previewPrefix); err != nil {
		return err
	}

	log.Printf("done: %s", masterKey)
	log.Println("completed the task")
	return nil
}

func (p *Processor) downloadFromS3(ctx context.Context, key, dest string) error {
	out, err := p.S3.GetObject(ctx, &s3.GetObjectInput{
		Key:    aws.String(key),
		Bucket: aws.String(p.Bucket),
	})
	if err != nil {
		return fmt.Errorf("get object: %w", err)
	}
	defer out.Body.Close()

	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := io.Copy(f, out.Body); err != nil {
		return fmt.Errorf("write file: %w", err)
	}
	return nil
}

func createHLSPreview(ctx context.Context, inputPath, outputDir string) error {
	// Forward slashes: ffmpeg %v substitution breaks on Windows backslashes.
	segmentPattern := filepath.ToSlash(
		filepath.Join("stream_%v", "segment_%03d.ts"),
	)
	playlistPattern := filepath.ToSlash(
		filepath.Join("stream_%v", "index.m3u8"),
	)
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-y", "-i", inputPath,
		"-filter_complex", "[0:v]split=2[v360][v720];[v360]scale=-2:360[v360out];[v720]scale=-2:720[v720out]",
		"-map", "[v360out]", "-map", "0:a?",
		"-c:v:0", "libx264", "-preset:v:0", "veryfast", "-crf:v:0", "24",
		"-b:v:0", "700k", "-maxrate:v:0", "850k", "-bufsize:v:0", "1200k",
		"-c:a:0", "aac", "-b:a:0", "96k",
		"-map", "[v720out]", "-map", "0:a?",
		"-c:v:1", "libx264", "-preset:v:1", "veryfast", "-crf:v:1", "24",
		"-b:v:1", "2200k", "-maxrate:v:1", "2600k", "-bufsize:v:1", "3600k",
		"-c:a:1", "aac", "-b:a:1", "128k",
		"-f", "hls",
		"-hls_time", "8",
		"-hls_playlist_type", "vod",
		"-hls_segment_filename", segmentPattern,
		"-master_pl_name", "master.m3u8",
		"-var_stream_map", "v:0,a:0,name:360p v:1,a:1,name:720p",
		playlistPattern,
	)
	cmd.Dir = outputDir
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg failed: %w\n%s", err, out)
	}
	return nil
}

/*
These files are independent. Uploading segment_001.ts does not depend on uploading segment_000.ts. So you can upload several at the same time.
But don’t start unlimited goroutines. Use a small concurrency limit, like 4.
Conceptually:
upload 4 files at once
when one finishes, start another
if any upload fails, return error
*/

func (p *Processor) uploadDirToS3(ctx context.Context, localDir, s3Prefix string) error {
	return filepath.Walk(localDir, func(fp string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(localDir, fp)
		if err != nil {
			return err
		}
		key := path.Join(s3Prefix, filepath.ToSlash(rel))
		return p.uploadFileWithRetry(ctx, fp, key)
	})
}

func (p *Processor) uploadFileWithRetry(ctx context.Context, filePath, key string) error {
	var last error
	for attempt := 1; attempt <= 3; attempt++ {
		last = p.uploadFile(ctx, filePath, key)
		if last == nil {
			log.Printf("uploaded %s", key)
			return nil
		}
		log.Printf("upload failed %s attempt %d: %v", key, attempt, last)
		time.Sleep(time.Duration(attempt) * 2 * time.Second)
	}
	return last
}

func (p *Processor) uploadFile(ctx context.Context, filePath, key string) error {
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()
	stat, err := f.Stat()
	if err != nil {
		return err
	}
	_, err = p.S3.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(p.Bucket),
		Key:           aws.String(key),
		Body:          f,
		ContentType:   aws.String(contentType(filePath)),
		ContentLength: aws.Int64(stat.Size()),
	})
	return err
}

func createPreviewPrefix(sourceKey string) string {
	dir := path.Dir(sourceKey)
	name := strings.TrimSuffix(path.Base(sourceKey), path.Ext(sourceKey))
	return path.Join("previews", dir, name)
}

func fileNameFromKey(key string) string {
	base := path.Base(key)
	if base == "." || base == "/" {
		return "source-video"
	}
	return base
}

func contentType(filePath string) string {
	switch strings.ToLower(filepath.Ext(filePath)) {
	case ".m3u8":
		return "application/vnd.apple.mpegurl"
	case ".ts":
		return "video/mp2t"
	default:
		return "application/octet-stream"
	}
}
