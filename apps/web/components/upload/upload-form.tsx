"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [creators, setCreators] = useState<
    { id: string; name: string | null; email: string }[]
  >([]);
  const [creatorId, setCreatorId] = useState("");

  useEffect(() => {
    goApi
      .get("/links")
      .then((res) => {
        const list = res.data.creators ?? [];
        setCreators(list);
        if (list.length === 1) setCreatorId(list[0].id);
      })
      .catch(() => {});
  }, []);

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

    if (!creatorId) {
      alert("Please select a creator");
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
          creatorId: creatorId,
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
          className="mt-5"
          variant="brand"
          size="lg"
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
      <Label className="block">
        Video title
        <Input
          className="mt-2"
          type="text"
          placeholder="Enter the title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </Label>

      <FilePicker onFileSelect={setVideoFile} />

      <label className="block">
        <span className="text-sm font-medium text-text-900">Creator</span>
        <select
          value={creatorId}
          onChange={(event) => setCreatorId(event.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-background-200 bg-background-50 px-3 text-sm text-text-950 outline-none transition focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
        >
          <option value="">Select creator…</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ? `${c.name} (${c.email})` : c.email}
            </option>
          ))}
        </select>
        {creators.length === 0 ? (
          <p className="mt-1 text-xs text-amber-700">
            No linked creators — link one from the dashboard first.
          </p>
        ) : null}
      </label>

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
        <Alert variant="destructive">
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        variant="brand"
        size="lg"
        className="w-full"
        disabled={isUploading}
        type="submit"
      >
        {isUploading ? statusLabels[uploadStatus] : "Upload"}
      </Button>
    </form>
  );
}