"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { UploadForm } from "./upload-form";

type UploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
};

export function UploadDialog({ open, onClose, onUploaded }: UploadDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
    >
      <div
        className="animate-overlay-in absolute inset-0 bg-background-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="animate-panel-in relative flex max-h-[calc(100svh-4rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-background-200 bg-background-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-background-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
              UploadRelay
            </p>
            <h2
              id="upload-dialog-title"
              className="mt-0.5 text-xl font-semibold tracking-tight text-text-950"
            >
              Upload a final video
            </h2>
            <p className="mt-1 text-xs leading-5 text-text-600">
              The original is sent to S3 in multipart chunks and staged for
              preview and approval.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload dialog"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              "border border-background-200 bg-background-50 text-text-600",
              "transition-colors hover:border-background-300 hover:text-text-950",
            )}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <UploadForm onUploaded={onUploaded} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}