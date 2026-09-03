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
