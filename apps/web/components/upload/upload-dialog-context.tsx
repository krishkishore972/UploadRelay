"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

import { UploadDialog } from "./upload-dialog";

type UploadDialogContextValue = {
  openUpload: () => void;
  closeUpload: () => void;
  uploadVersion: number;
};

const UploadDialogContext = createContext<UploadDialogContextValue | null>(
  null,
);

export function UploadDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadVersion, setUploadVersion] = useState(0);

  const openUpload = useCallback(() => setIsOpen(true), []);
  const closeUpload = useCallback(() => setIsOpen(false), []);

  return (
    <UploadDialogContext.Provider
      value={{ openUpload, closeUpload, uploadVersion }}
    >
      {children}
      <UploadDialog
        open={isOpen}
        onClose={closeUpload}
        onUploaded={() => setUploadVersion((version) => version + 1)}
      />
    </UploadDialogContext.Provider>
  );
}

export function useUploadDialog() {
  const context = useContext(UploadDialogContext);

  if (!context) {
    throw new Error(
      "useUploadDialog must be used within an UploadDialogProvider",
    );
  }

  return context;
}