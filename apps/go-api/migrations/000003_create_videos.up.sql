CREATE TABLE "Video" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  "title" TEXT,
  "description" TEXT,

  "editorId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,

  "originalFileName" TEXT NOT NULL,
  "originalS3Key" TEXT NOT NULL UNIQUE,
  "originalMimeType" TEXT,
  "originalSize" BIGINT,

  "uploadId" TEXT,
  "previewPrefix" TEXT,
  "masterPlaylistKey" TEXT,
  "status" "VideoStatus" NOT NULL DEFAULT 'UPLOADING',

  "approvalRequestedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Video_editorId_fkey"
    FOREIGN KEY ("editorId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "Video_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Video_editorId_idx" ON "Video"("editorId");
CREATE INDEX "Video_creatorId_idx" ON "Video"("creatorId");
CREATE INDEX "Video_status_idx" ON "Video"("status");
