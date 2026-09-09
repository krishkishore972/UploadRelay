"use client";

import { FormEvent, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { createVideoChunks } from "@/lib/upload/create-video-chunks";
import type { UploadedPart, UploadStatus } from "@/lib/upload/types";
import { FilePicker } from "./file-picker";
import { UploadSummary } from "./upload-summary";
import { goApi } from "@/lib/go-api";

const statusLabels: Record<UploadStatus, string> = {
  idle: "Waiting for video",
  creating: "Preparing upload",
  uploading: "Uploading chunks",
  completing: "Finalizing upload",
  completed: "Upload complete",
  failed: "Upload failed",
};

type UploadFormProps = {
  onUploaded?: () => void;
  onClose?: () => void;
};

export function UploadForm({ onUploaded, onClose }: UploadFormProps) {
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

    let videoId: string | null = null;
    let uploadKey: string | null = null;
    let uploadId: string | null = null;

    try {
      setErrorMessage("");
      setUploadProgress(0);
      setUploadStatus("creating");

      const chunks = createVideoChunks(videoFile);

      const createUploadResponse = await goApi.post(
        "/uploads/create",
        {
          fileName: videoFile.name,
          fileType: videoFile.type,
          fileSize: videoFile.size,
          title: title,
        },
      );

      const createUploadData = createUploadResponse.data;
      uploadKey = createUploadData.key;
      uploadId = createUploadData.uploadId;
      videoId = createUploadData.videoId;

      const uploadedParts: UploadedPart[] = [];
      let uploadedBytes = 0;

      setUploadStatus("uploading");

      for (const chunk of chunks) {
        const signedPartResponse = await goApi.post(
          "/uploads/sign-part",
          {
            videoId: createUploadData.videoId,
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

      const completeResponse = await goApi.post(
        "/uploads/complete",
        {
          videoId: createUploadData.videoId,
          key: createUploadData.key,
          uploadId: createUploadData.uploadId,
          parts: uploadedParts,
        },
      );

      console.log("completed upload:", completeResponse.data);
      setUploadProgress(100);
      setUploadStatus("completed");
      onUploaded?.();
    } catch (error) {
      console.error(error);

      if (videoId && uploadKey && uploadId) {
        try {
          await goApi.post("/uploads/abort", {
            videoId,
            key: uploadKey,
            uploadId,
          });
          console.log("Multipart upload aborted");
        } catch (abortError) {
          console.error("Failed to abort multipart upload:", abortError);
        }
      }

      setUploadStatus("failed");
      setErrorMessage("Upload failed. Please try again.");
    }
  }

  const isUploading =
    uploadStatus === "creating" ||
    uploadStatus === "uploading" ||
    uploadStatus === "completing";

  if (uploadStatus === "completed") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </span>
        <h3 className="mt-4 text-base font-semibold text-text-950">
          Upload complete
        </h3>
        <p className="mt-1 max-w-xs text-sm leading-6 text-text-600">
          Your master cut is now processing. You can track its status from the
          dashboard.
        </p>
        <Button
          className="mt-5 h-10 bg-primary-700 font-semibold text-text-50 hover:bg-primary-800"
          type="button"
          onClick={onClose}
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-medium text-text-900">Video title</span>
        <input
          className="mt-2 h-11 w-full rounded-md border border-background-200 bg-background-50 px-3 text-sm text-text-950 outline-none transition placeholder:text-text-700 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
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
            <p className="text-sm font-semibold text-primary-700">
              {uploadProgress}%
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background-200">
            <div
              className="h-full rounded-full bg-primary-700 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
    </form>
  );
}