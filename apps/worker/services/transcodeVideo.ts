import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { mkdir, readdir, rm } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { basename, join, posix, relative, sep } from "node:path";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.S3_BUCKET_NAME!;

/*
Main transcoding function.

Example input:

await transcodeVideo({
  sourceKey: "uploads/user-123/holiday.mp4",
});

Example return value:

{
  sourceKey: "uploads/user-123/holiday.mp4",
  previewPrefix: "previews/uploads/user-123/holiday",
  masterPlaylistKey:
    "previews/uploads/user-123/holiday/master.m3u8"
}
*/

export async function transcodeVideo({ sourceKey }: { sourceKey: string }) {
  if (!sourceKey) {
    throw new Error("sourceKey is required");
  }

  const workDir = join(import.meta.dir, "..", "tmp", crypto.randomUUID());
  /*
  uploads/user-123/holiday.mp4
  getFileNameFromKey(sourceKey) returns:
  holiday.mp4
  Example inputPath:
  /app/tmp/random-job-id/holiday.mp4
  */

  const inputPath = join(workDir, getFileNameFromKey(sourceKey));
  /*
  Local directory where FFmpeg will generate all HLS files.
  Example:
  /app/tmp/random-job-id/hls
  */
  const hlsOutputDir = join(workDir, "hls");

  /*
  Creates the base S3 path for this video's generated preview files.

  Example input:

  uploads/user-123/holiday.mp4

  createPreviewPrefix() returns:

  previews/uploads/user-123/holiday

  All HLS files will be uploaded under this prefix.
  */

  const previewPrefix = createPreviewPrefix(sourceKey);

  /*
  Creates the exact S3 key for the master HLS playlist.

  previewPrefix:

  previews/uploads/user-123/holiday

  Result:

  previews/uploads/user-123/holiday/master.m3u8

  This is the main file that the frontend video player loads.
  */

  const masterPlaylistKey = posix.join(previewPrefix, "master.m3u8");

  await mkdir(hlsOutputDir, { recursive: true });

  try {
    console.log("Downloading original:", sourceKey);
    //  /app/tmp/random-job-id/holiday.mp4
    await downloadFromS3(sourceKey, inputPath);

    console.log("creating hls preview");
    await createHlsPreview(inputPath, hlsOutputDir);

    console.log("uploading HLS preview:", previewPrefix);
    // previews/uploads/user-123/holiday
    await uploadDirectoryToS3(hlsOutputDir, previewPrefix);

    console.log("HLS preview created", masterPlaylistKey);

    return {
      sourceKey,
      previewPrefix,
      masterPlaylistKey,
    };
  } finally {
    await rm(workDir, {
      recursive: true,
      force: true,
    });
  }
}

async function downloadFromS3(key: string, destinationPath: string) {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
  if (!result.Body) {
    throw new Error("S3 object body is empty");
  }
  await pipeline(result.Body as Readable, createWriteStream(destinationPath));
}

async function createHlsPreview(inputPath: string, outputDir: string) {
  const ffmpeg = Bun.spawn({
    cmd: [
      "ffmpeg",
      "-y",
      "-i",
      inputPath,

      "-filter_complex",
      "[0:v]split=4[v360][v480][v720][v1080];[v360]scale=-2:360[v360out];[v480]scale=-2:480[v480out];[v720]scale=-2:720[v720out];[v1080]scale=-2:1080[v1080out]",

      "-map",
      "[v360out]",
      "-map",
      "0:a?",
      "-c:v:0",
      "libx264",
      "-b:v:0",
      "800k",
      "-maxrate:v:0",
      "900k",
      "-bufsize:v:0",
      "1200k",
      "-c:a:0",
      "aac",
      "-b:a:0",
      "96k",

      "-map",
      "[v480out]",
      "-map",
      "0:a?",
      "-c:v:1",
      "libx264",
      "-b:v:1",
      "1400k",
      "-maxrate:v:1",
      "1600k",
      "-bufsize:v:1",
      "2200k",
      "-c:a:1",
      "aac",
      "-b:a:1",
      "128k",

      "-map",
      "[v720out]",
      "-map",
      "0:a?",
      "-c:v:1",
      "libx264",
      "-b:v:1",
      "2500k",
      "-maxrate:v:1",
      "2800k",
      "-bufsize:v:1",
      "4000k",
      "-c:a:1",
      "aac",
      "-b:a:1",
      "128k",

      "-map",
      "[v1080out]",
      "-map",
      "0:a?",
      "-c:v:2",
      "libx264",
      "-b:v:2",
      "5000k",
      "-maxrate:v:2",
      "5500k",
      "-bufsize:v:2",
      "8000k",
      "-c:a:2",
      "aac",
      "-b:a:2",
      "192k",

      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      join(outputDir, "stream_%v", "segment_%03d.ts"),
      "-master_pl_name",
      "master.m3u8",
      "-var_stream_map",
      "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p v:3,a:3,name:1080p",
      join(outputDir, "stream_%v", "index.m3u8"),
    ],
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await ffmpeg.exited;
  if (exitCode !== 0) {
    const errorOutput = await new Response(ffmpeg.stderr).text();

    throw new Error(`FFmpeg failed with exit code ${exitCode}\n${errorOutput}`);
  }
}

async function uploadFileToS3WithRetry(filePath: string, key: string) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const file = Bun.file(filePath);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: bytes,
          ContentType: getContentType(filePath),
          ContentLength: bytes.length,
        }),
      );

      return;
    } catch (error) {
      console.error(`Upload failed for ${key}, attempt ${attempt}`, error);

      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

async function uploadDirectoryToS3(localDir: string, s3Prefix: string) {
  const files = await getFilesRecursively(localDir);

  for (const filePath of files) {
    const relativePath = relative(localDir, filePath).split(sep).join("/");
    const key = posix.join(s3Prefix, relativePath);

    await uploadFileToS3WithRetry(filePath, key);

    console.log("uploaded Key", key);
  }
}

async function getFilesRecursively(dir: string): Promise<string[]> {
  const entries = await readdir(dir, {
    withFileTypes: true,
  });

  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return getFilesRecursively(fullPath);
      }
      return [fullPath];
    }),
  );
  return files.flat();
}

function createPreviewPrefix(sourceKey: string) {
  const parsed = posix.parse(sourceKey);

  return posix.join("previews", parsed.dir, parsed.name);
}

function getFileNameFromKey(key: string) {
  return basename(key) || "source-video";
}

function getContentType(filePath: string) {
  if (filePath.endsWith(".m3u8")) {
    return "application/vnd.apple.mpegurl";
  }

  if (filePath.endsWith(".ts")) {
    return "video/mp2t";
  }

  return "application/octet-stream";
}
