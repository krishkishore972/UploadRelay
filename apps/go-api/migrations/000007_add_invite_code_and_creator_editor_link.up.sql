ALTER TABLE "User" ADD COLUMN "inviteCode" TEXT UNIQUE;

CREATE TABLE "CreatorEditorLink" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "creatorId" TEXT NOT NULL,
  "editorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreatorEditorLink_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "CreatorEditorLink_editorId_fkey"
    FOREIGN KEY ("editorId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "CreatorEditorLink_pair_unique"
    UNIQUE ("creatorId", "editorId"),

  CONSTRAINT "CreatorEditorLink_no_self_link"
    CHECK ("creatorId" <> "editorId")
);

CREATE INDEX "CreatorEditorLink_creatorId_idx" ON "CreatorEditorLink"("creatorId");
CREATE INDEX "CreatorEditorLink_editorId_idx" ON "CreatorEditorLink"("editorId");