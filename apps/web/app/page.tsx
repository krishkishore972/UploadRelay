"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

const CHUNK_SIZE = 25 * 1024 * 1024; // 25 MB

export default function Home() {
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);


  function createVideoChunks(file: File) {
    const chunks: {
      partNumber: number;
      blob: Blob;
      start: number;
      end: number;
    }[] = [];
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      alert("Please enter the title");
      return;
    }
    if (!videoFile) {
      alert("please select a video");
      return;
    }
    const chunks = createVideoChunks(videoFile);
    console.log({
      title: title.trim(),
      totalChunks: chunks.length,
      chunks: chunks.map((chunk) => ({
        partNumber: chunk.partNumber,
        size: chunk.blob.size,
        start: chunk.start,
        end: chunk.end,
      })),
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter the title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
        />

        <Button type="submit">upload</Button>
      </form>
    </div>
  );
}
