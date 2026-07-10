"use client";

import { FormEvent, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/lib/utils";
import { createVideoChunks } from "@/lib/upload/create-video-chunks";
import type { UploadedPart, UploadStatus } from "@/lib/upload/types";
import { FilePicker } from "./file-picker";
import { UploadSummary } from "./upload-summary";

const statusLabels: Record<UploadStatus, string> = {
  idle: "Waiting for video",
  creating: "Preparing upload",
  uploading: "Uploading chunks",
  completing: "Finalizing upload",
  completed: "Upload complete",
  failed: "Upload failed",
};

export function UploadForm() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
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

    try {
      setErrorMessage("");
      setUploadProgress(0);
      setUploadStatus("creating");

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
      const uploadedParts: UploadedPart[] = [];
      let uploadedBytes = 0;

      setUploadStatus("uploading");

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
          {
            onUploadProgress: (progressEvent) => {
              const currentChunkUploaded = progressEvent.loaded;
              const totalUploaded = uploadedBytes + currentChunkUploaded;
              const progress = Math.round(
                (totalUploaded / videoFile.size) * 100,
              );

              setUploadProgress(progress);
            },
          },
        );

        uploadedBytes += chunk.blob.size;
        uploadedParts.push({
          PartNumber: chunk.partNumber,
          ETag: uploadPartResponse.headers.etag,
        });
      }

      setUploadStatus("completing");

      const completeResponse = await axios.post(`${BASE_URL}/uploads/complete`, {
        key: createUploadData.key,
        uploadId: createUploadData.uploadId,
        parts: uploadedParts,
      });

      console.log("completed upload:", completeResponse.data);
      setUploadProgress(100);
      setUploadStatus("completed");
    } catch (error) {
      console.error(error);
      setUploadStatus("failed");
      setErrorMessage("Upload failed. Please try again.");
    }
  }

  const isUploading =
    uploadStatus === "creating" ||
    uploadStatus === "uploading" ||
    uploadStatus === "completing";

  return (
    <form
      className="mx-auto w-full max-w-2xl rounded-lg border border-background-200 bg-background-100/80 p-5 shadow-2xl shadow-primary-50/20 sm:p-7"
      onSubmit={handleSubmit}
    >
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-800">
          UploadRelay
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-950 sm:text-4xl">
          Upload a final video
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-text-800">
          The browser uploads the original file to S3 in multipart chunks. After
          approval, this original can be sent to the creator&apos;s YouTube
          channel.
        </p>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-text-900">Video title</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-background-200 bg-background-50 px-3 text-sm text-text-950 outline-none transition placeholder:text-text-700 focus:border-accent-700 focus:ring-2 focus:ring-accent-700/20"
            type="text"
            placeholder="Enter the title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <FilePicker onFileSelect={setVideoFile} />

        {videoFile ? <UploadSummary file={videoFile} /> : null}

        {uploadStatus !== "idle" ? (
          <div className="rounded-lg border border-background-200 bg-background-50/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-text-950">
                {statusLabels[uploadStatus]}
              </p>
              <p className="text-sm font-semibold text-accent-800">
                {uploadProgress}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-background-200">
              <div
                className="h-full rounded-full bg-accent-700 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="rounded-md border border-accent-700/30 bg-accent-700/10 px-3 py-2 text-sm text-accent-900">
            {errorMessage}
          </p>
        ) : null}

        <Button
          className="h-11 w-full bg-primary-700 font-semibold text-text-50 hover:bg-primary-800"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? statusLabels[uploadStatus] : "Upload"}
        </Button>
      </div>
    </form>
  );
}
