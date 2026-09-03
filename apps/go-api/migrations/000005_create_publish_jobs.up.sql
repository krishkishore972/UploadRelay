CREATE TABLE "PublishJob" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  "videoId" TEXT NOT NULL,
  "youtubeConnectionId" TEXT,

  "youtubeVideoId" TEXT,
  "youtubeUrl" TEXT,

  "title" TEXT NOT NULL,
  "description" TEXT,
  "privacy" "YouTubePrivacy" NOT NULL DEFAULT 'PRIVATE',

  "status" "PublishStatus" NOT NULL DEFAULT 'PENDING',

  "errorMessage" TEXT,

  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PublishJob_videoId_fkey"
    FOREIGN KEY ("videoId") REFERENCES "Video"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PublishJob_videoId_idx" ON "PublishJob"("videoId");
CREATE INDEX "PublishJob_status_idx" ON "PublishJob"("status");
