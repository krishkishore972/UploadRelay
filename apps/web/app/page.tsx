"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { BASE_URL } from "@/lib/utils";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const createUploadResponse = await axios.post(
      `${BASE_URL}/uploads/create`,
      {
        fileName: videoFile.name,
        fileType: videoFile.type,
        fileSize: videoFile.size,
      },
    );

    const createUploadData = createUploadResponse.data;
    console.log(createUploadData);

    const uploadedParts = [];

    for (const chunk of chunks) {
      const signedPartResponse = await axios.post(
        `${BASE_URL}/uploads/sign-part`,
        {
          key: createUploadData.key,
          uploadId: createUploadData.uploadId,
          partNumber: chunk.partNumber,
        },
      );

      const signedPartData = signedPartResponse.data;
      const uploadPartResponse = await axios.put(
        signedPartData.signedUrl,
        chunk.blob,
      );
      uploadedParts.push({
        PartNumber: chunk.partNumber,
        ETag: uploadPartResponse.headers.etag,
      });
      console.log(`Uploaded part ${chunk.partNumber}/${chunks.length}`);
    }
    console.log("uploadedParts", uploadedParts);
    

    const completeResponse = await axios.post(`${BASE_URL}/uploads/complete`, {
      key: createUploadData.key,
      uploadId: createUploadData.uploadId,
      parts: uploadedParts,
    });
    console.log("completed upload:", completeResponse.data);
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
