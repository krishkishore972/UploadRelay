"use client";

import { FormEvent, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/lib/utils";
import { createVideoChunks } from "@/lib/upload/create-video-chunks";
import type { UploadedPart } from "@/lib/upload/types";
import { FilePicker } from "./file-picker";
import { UploadSummary } from "./upload-summary";

export function UploadForm() {
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter the title");
      return;
    }

    if (!videoFile) {
      alert("Please select a video");
      return;
    }

    const chunks = createVideoChunks(videoFile);

    const createUploadResponse = await axios.post(`${BASE_URL}/uploads/create`, {
      fileName: videoFile.name,
      fileType: videoFile.type,
      fileSize: videoFile.size,
    });

    const createUploadData = createUploadResponse.data;

    const uploadedParts: UploadedPart[] = [];

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
    }

    const completeResponse = await axios.post(`${BASE_URL}/uploads/complete`, {
      key: createUploadData.key,
      uploadId: createUploadData.uploadId,
      parts: uploadedParts,
    });

    console.log("completed upload:", completeResponse.data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter the title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <FilePicker onFileSelect={setVideoFile} />

      {videoFile ? <UploadSummary file={videoFile} /> : null}

      <Button type="submit">Upload</Button>
    </form>
  );
}