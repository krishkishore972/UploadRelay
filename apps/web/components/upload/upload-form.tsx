"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createVideoChunks } from "@/lib/upload/create-video-chunks";
import type { UploadedPart, UploadStatus } from "@/lib/upload/types";
import { FilePicker } from "./file-picker";
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
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    file?: string;
    creator?: string;
  }>({});

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

    const nextErrors: typeof fieldErrors = {};
    if (!title.trim()) nextErrors.title = "Please enter a title.";
    if (!videoFile) nextErrors.file = "Please choose a video file.";
    if (!creatorId) nextErrors.creator = "Please select a creator.";
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !videoFile) {
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

      const createUploadResponse = await goApi.post("/uploads/create", {
        fileName: videoFile.name,
        fileType: videoFile.type,
        fileSize: videoFile.size,
        title: title,
        creatorId: creatorId,
      });

      const createUploadData = createUploadResponse.data;
      uploadKey = createUploadData.key;
      uploadId = createUploadData.uploadId;
      videoId = createUploadData.videoId;

      const uploadedParts: UploadedPart[] = [];
      let uploadedBytes = 0;

      setUploadStatus("uploading");

      for (const chunk of chunks) {
        const signedPartResponse = await goApi.post("/uploads/sign-part", {
          videoId: createUploadData.videoId,
          key: createUploadData.key,
          uploadId: createUploadData.uploadId,
          partNumber: chunk.partNumber,
        });

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

      const completeResponse = await goApi.post("/uploads/complete", {
        videoId: createUploadData.videoId,
        key: createUploadData.key,
        uploadId: createUploadData.uploadId,
        parts: uploadedParts,
      });

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
      <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-8 text-center sm:px-6 sm:py-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-700" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-neutral-950">
          Upload complete
        </h3>
        <p className="mt-1 max-w-xs text-[13px] leading-6 text-neutral-500 sm:text-sm">
          Your master cut is now processing. You can track its status from the
          dashboard.
        </p>
        <Button
          className="mt-5 w-full sm:w-auto"
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
    <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="upload-title">Video title</Label>
        <Input
          id="upload-title"
          className="h-11 rounded-xl"
          type="text"
          placeholder="e.g. Launch teaser — final cut"
          value={title}
          disabled={isUploading}
          aria-invalid={Boolean(fieldErrors.title)}
          onChange={(event) => {
            setTitle(event.target.value);
            if (fieldErrors.title) {
              setFieldErrors((prev) => ({ ...prev, title: undefined }));
            }
          }}
        />
        {fieldErrors.title ? (
          <p className="text-xs font-medium text-red-600">
            {fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label>Video file</Label>
        <FilePicker
          file={videoFile}
          disabled={isUploading}
          error={fieldErrors.file}
          onFileSelect={(file) => {
            setVideoFile(file);
            if (file && fieldErrors.file) {
              setFieldErrors((prev) => ({ ...prev, file: undefined }));
            }
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="upload-creator">Creator</Label>
        <select
          id="upload-creator"
          value={creatorId}
          disabled={isUploading}
          aria-invalid={Boolean(fieldErrors.creator)}
          onChange={(event) => {
            setCreatorId(event.target.value);
            if (fieldErrors.creator) {
              setFieldErrors((prev) => ({ ...prev, creator: undefined }));
            }
          }}
          className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-300 aria-[invalid=true]:ring-red-100"
        >
          <option value="">Select creator…</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ? `${c.name} (${c.email})` : c.email}
            </option>
          ))}
        </select>
        {fieldErrors.creator ? (
          <p className="text-xs font-medium text-red-600">
            {fieldErrors.creator}
          </p>
        ) : creators.length === 0 ? (
          <p className="text-xs leading-5 text-amber-700">
            No linked creators — link one from the dashboard first.
          </p>
        ) : null}
      </div>

      {uploadStatus !== "idle" ? (
        <div
          className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[13px] font-medium text-neutral-950 sm:text-sm">
              {statusLabels[uploadStatus]}
            </p>
            <p className="shrink-0 font-mono text-xs font-semibold text-neutral-950">
              {uploadProgress}%
            </p>
          </div>
          <div
            className="mt-2.5 h-2 overflow-hidden rounded-full bg-neutral-200"
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-neutral-950 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button
          variant="brandOutline"
          size="lg"
          type="button"
          disabled={isUploading}
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="brand"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {statusLabels[uploadStatus]}…
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload video
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
