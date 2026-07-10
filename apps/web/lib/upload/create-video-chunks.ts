import type { VideoChunk } from "./types";

const CHUNK_SIZE = 25 * 1024 * 1024; // 25 MB

export function createVideoChunks(file: File): VideoChunk[] {
  const chunks: VideoChunk[] = [];

  let start = 0;
  let partNumber = 1;

  while (start < file.size) {
    const end = Math.min(start + CHUNK_SIZE, file.size);

    chunks.push({
      partNumber,
      blob: file.slice(start, end),
      start,
      end,
    });

    start = end;
    partNumber += 1;
  }

  return chunks;
}