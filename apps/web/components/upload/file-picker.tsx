"use client";

import { useId } from "react";
import { Clapperboard, UploadCloud, X } from "lucide-react";

import { formatBytes } from "@/lib/upload/format-bytes";

type FilePickerProps = {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  error?: string;
};

export function FilePicker({
  file,
  onFileSelect,
  disabled = false,
  error,
}: FilePickerProps) {
  const inputId = useId();

  if (file) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-white">
            <Clapperboard className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-950">
              {file.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-500">
              {file.type || "video"} · {formatBytes(file.size)}
            </p>
            <label
              htmlFor={inputId}
              className="mt-2 inline-flex cursor-pointer text-xs font-semibold text-neutral-950 underline underline-offset-4 hover:text-neutral-700"
            >
              Choose a different file
            </label>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onFileSelect(null)}
            aria-label="Remove selected video"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-white hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept="video/*"
          disabled={disabled}
          onChange={(event) => {
            onFileSelect(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition sm:py-8 ${
          error
            ? "border-red-300 bg-red-50/50 hover:border-red-400"
            : "border-neutral-300 bg-neutral-50 hover:border-neutral-950 hover:bg-neutral-100/70"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200 transition group-hover:ring-neutral-950/20">
          <UploadCloud className="h-4 w-4 text-neutral-950" aria-hidden="true" />
        </span>
        <span className="mt-3 text-sm font-semibold text-neutral-950">
          Choose a video
        </span>
        <span className="mt-1 max-w-full text-xs leading-5 text-neutral-500 sm:text-[13px]">
          MP4, MOV or WebM. Large files upload in multipart chunks.
        </span>
        <span className="mt-4 inline-flex h-9 items-center rounded-full border border-neutral-300 bg-white px-4 text-xs font-semibold text-neutral-950 transition group-hover:border-neutral-950">
          Browse files
        </span>
      </label>
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept="video/*"
        disabled={disabled}
        onChange={(event) => {
          onFileSelect(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
