CREATE TABLE "OAuthState" (
  "state" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),

  CONSTRAINT "OAuthState_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OAuthState_userId_idx" ON "OAuthState"("userId");
CREATE INDEX "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");