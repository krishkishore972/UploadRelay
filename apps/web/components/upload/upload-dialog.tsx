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
      <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-neutral-100 px-5 py-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent">
            UploadRelay
          </p>
          <DialogTitle>Upload a final video</DialogTitle>
          <DialogDescription>
            The original is sent to S3 in multipart chunks and staged for
            preview and approval.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-5 sm:px-6">
          <UploadForm onUploaded={onUploaded} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
