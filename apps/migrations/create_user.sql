
CREATE TYPE "VideoStatus" AS ENUM (
  'UPLOADING',
  'UPLOADED',
  'TRANSCODING',
  'PREVIEW_READY',
  'TRANSCODE_FAILED',
  'APPROVAL_REQUESTED',
  'APPROVED',
  'REJECTED',
  'PUBLISHING',
  'PUBLISHED',
  'PUBLISH_FAILED'
);

CREATE TYPE "UserRole" AS ENUM (
  'CREATOR',
  'EDITOR',
  'ADMIN'
);

CREATE TYPE "PublishStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE "YouTubePrivacy" AS ENUM (
  'PRIVATE',
  'UNLISTED',
  'PUBLIC'
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT,
  "email" TEXT NOT NULL UNIQUE,
  "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE "YouTubeConnection" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  "userId" TEXT NOT NULL UNIQUE,

  "googleAccountEmail" TEXT,
  "youtubeChannelId" TEXT,
  "youtubeChannelTitle" TEXT,

  "accessTokenEncrypted" TEXT,
  "refreshTokenEncrypted" TEXT NOT NULL,

  "tokenExpiry" TIMESTAMP(3),
  "scope" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "YouTubeConnection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

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

CREATE INDEX "Video_editorId_idx" ON "Video"("editorId");
CREATE INDEX "Video_creatorId_idx" ON "Video"("creatorId");
CREATE INDEX "Video_status_idx" ON "Video"("status");

CREATE INDEX "PublishJob_videoId_idx" ON "PublishJob"("videoId");
CREATE INDEX "PublishJob_status_idx" ON "PublishJob"("status");