"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadForm } from "./upload-form";

type UploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
};

export function UploadDialog({ open, onClose, onUploaded }: UploadDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-neutral-100 px-4 pb-4 pt-5 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            UploadRelay
          </p>
          <DialogTitle className="mt-1 text-lg sm:text-xl">
            Upload a final video
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] sm:text-sm">
            The original is sent to S3 in multipart chunks and staged for
            preview and approval.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <UploadForm onUploaded={onUploaded} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
