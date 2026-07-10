export type VideoChunk = {
  partNumber: number;
  blob: Blob;
  start: number;
  end: number;
};

export type UploadedPart = {
  PartNumber: number;
  ETag: string;
};

export type UploadStatus =
  | "idle"
  | "creating"
  | "uploading"
  | "completing"
  | "completed"
  | "failed";