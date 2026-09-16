# UploadRelay

**Upload once. Review anywhere. Publish directly to YouTube.**

UploadRelay is a cloud-based collaboration and publishing platform for creators, editors, and small media teams. An editor uploads a large final video once to UploadRelay. The creator reviews a lightweight HLS preview in the browser, approves it, and publishes the original high-quality file directly to their connected YouTube channel — without downloading or re-uploading the file.

## The Problem

Remote YouTube workflows are slow:

1. Editor finishes the final cut.
2. Editor uploads a large file (5 GB, 10 GB+) to cloud storage.
3. Creator downloads it to review.
4. Creator approves or requests changes.
5. Creator re-uploads the same file to YouTube.

This breaks on slow connections, mobile data, travel, and deadlines.

UploadRelay fixes it:

```text
Editor uploads original once to S3 via UploadRelay
              |
UploadRelay generates HLS preview (360p + 720p)
              |
Creator reviews preview in browser, no download
              |
Editor submits -> Creator approves / rejects
              |
UploadRelay publishes original to YouTube
```

The creator keeps control of their channel. The editor never needs channel access. The original never travels through the creator's device.

## What Works Today

This is what the current codebase actually does. Nothing below is aspirational.

### Authentication and Roles

- Email/password signup and login (`/auth`, NextAuth Credentials + bcrypt).
- Roles: `CREATOR`, `EDITOR` (plus unused `ADMIN` enum value).
- Protected `/dashboard/*` routes with middleware redirects.
- Go API auth via short-lived JWT bridge (`GET /api/auth/go-token`, 15m, `jose` HS256).

### Creator-Editor Linking (No Workspaces Yet)

- Each creator gets a unique `inviteCode` on signup.
- Editor links to a creator with `POST /links { inviteCode }` (idempotent, upper-trim match).
- `GET /links` is role-aware: creators see their editors, editors see their creators.
- Team page at `/dashboard/links`.
- There is **no** Workspace model, no email invitations, no multi-role workspaces yet. Team = `CreatorEditorLink(creatorId, editorId)`.

### Large Video Uploads

- Browser-to-S3 multipart upload via Go API:
  - `POST /uploads/create { fileName, fileType, fileSize, title, creatorId }`
  - `POST /uploads/sign-part` per chunk
  - `PUT` directly to S3 presigned URLs with progress
  - `POST /uploads/complete` or `POST /uploads/abort` on failure/cancel
- Validates `video/*` MIME type.
- Validates `creatorId` is a `CREATOR` and linked to the editor (self-upload allowed for solo testing).
- Upload dialog from dashboard (no standalone `/upload` route).
- Statuses: `UPLOADING`, `UPLOADED`, `UPLOAD_ABORTED`.

### Preview Generation and Playback

- On complete, Go API enqueues Asynq `video:transcode` (Redis, MaxRetry 5, 20m timeout).
- Go worker downloads original from S3, runs FFmpeg HLS (`360p + 720p, hls_time 8, vod`), uploads to `previews/.../master.m3u8` in S3.
- Updates `Video` to `PREVIEW_READY` + `previewPrefix` / `masterPlaylistKey`, or `TRANSCODE_FAILED`.
- Browser playback with `hls.js` (`hls-player.tsx`).

### Review and Approval

- Pages:
  - `/dashboard/videos` – role-aware library (`GET /videos/creator` or `/videos/editor`)
  - `/dashboard/videos/[id]` – detail + preview player + actions + publish status
  - `/dashboard/review` – creator-only review queue
- Flow (enforced server-side):
  - `POST /videos/{id}/submit` – editor-only, `PREVIEW_READY -> APPROVAL_REQUESTED`
  - `POST /videos/{id}/approve` – creator-only, `-> APPROVED`
  - `POST /videos/{id}/reject` – creator-only, `-> REJECTED`
- There are **no** timestamped comments, no version history rows, no change-request text yet. Approval is a status transition only.

### YouTube Connection and Publishing

- Pages: `/dashboard/youtube`
- `GET /youtube/oauth/start -> Google OAuth URL`, `GET /youtube/oauth/callback` (public, redirects to `.../dashboard/youtube?youtube=connected|denied|...`), `GET /youtube/connection`, `DELETE /youtube/connection`.
- Publish:
  - `POST /videos/{id}/publish { title, description, privacy }` – creator-only, requires `APPROVED` + existing `YouTubeConnection`.
  - Creates `PublishJob PENDING`, sets `Video PUBLISHING`, enqueues Asynq `video:publish` (MaxRetry 3, 6h).
  - Worker streams S3 original to `youtube.videos.insert` in 8MB chunks.
  - Success: `PublishJob COMPLETED + youtubeVideoId/url`, `Video PUBLISHED`. Failure: `FAILED + PUBLISH_FAILED` with `errorMessage`.
- Current UI publishes as `PRIVATE` with title fallback to filename and empty description. No thumbnail upload, playlist, scheduling, or visibility picker yet.
- One active job per video enforced in DB: `UNIQUE(videoId) WHERE status IN (PENDING, RUNNING)`.

### Dashboard

- `/dashboard` overview, `/dashboard/videos`, `/dashboard/videos/[id]`, `/dashboard/review`, `/dashboard/youtube`, `/dashboard/links`.
- Landing page `/` + auth pages `/auth`, `/login` and `/signup` redirects.

## What Is Partially Implemented

- **Solo testing mode:** upload flow sets both `editorId` and `creatorId` to the logged-in user allowed; intended team flow is editor -> linked creator.
- **Metadata:** `Video.title/description` exist in DB, but upload only sends `title`, and publish UI hardcodes description. No thumbnail model, no tags, no playlist/schedule editing.
- **Status lifecycle:** upload / transcode / approval / publish statuses exist (`VideoStatus` with 12 values), but there is no UI for `TRANSCODE_FAILED` retry, no revision upload, no publish retry button beyond re-calling publish.
- **YouTube tokens:** refresh token encrypted in `YouTubeConnection.refreshTokenEncrypted`; no token rotation UI or expiry warnings yet.

## Not Implemented Yet

Do not promise these — they have no table, endpoint, or UI today:

- Workspaces, team invitations by email, multiple reviewers
- Timestamped comments, replies, mentions
- Video versions / revisions (single `Video` row per upload)
- Thumbnail upload, tags, description templates, playlists, scheduled publishing, visibility choice
- Email notifications, activity feed, audit logs
- Analytics, storage controls, billing
- Video delete / rename, account / workspace deletion
- `ADMIN` role usage
- E2E tests, Sentry, Resend, Docker Compose

## End-to-End Flow You Can Demo Today

1. Sign up as Creator, copy invite code from `/dashboard/links`.
2. Sign up as Editor, link with `POST /links { inviteCode }`.
3. As Editor: upload large video from dashboard, select creator, watch multipart progress complete.
4. Worker generates HLS preview. Open `/dashboard/videos/[id]` to play it.
5. As Editor: Submit for approval.
6. As Creator: open `/dashboard/review`, approve or reject.
7. As Creator: connect YouTube in `/dashboard/youtube` via Google OAuth.
8. As Creator: publish approved video, poll detail page while `PUBLISHING`, land on `PUBLISHED` with YouTube URL.

## Monorepo Structure

```text
UploadRelay/
|-- apps/
|   |-- web/       # Next.js 16 App Router, NextAuth, dashboard, upload dialog, HLS player
|   `-- go-api/    # Go net/http API, SQL migrations, Asynq worker (transcode + publish)
|
|-- packages/
|   |-- db/                    # Prisma client for web reads (6 models, no Prisma migrations)
|   |-- ui/                    # Shared UI components
|   |-- eslint-config/         # Shared ESLint config
|   `-- typescript-config/     # Shared TS config
|
|-- package.json
|-- turbo.json
`-- README.md
```

Database (Go SQL migrations are source of truth, 9 files in `apps/go-api/migrations`):

- `User`, `OAuthState`, `CreatorEditorLink`, `Video`, `YouTubeConnection`, `PublishJob`
- `VideoStatus`: `UPLOADING, UPLOADED, UPLOAD_ABORTED, TRANSCODING, PREVIEW_READY, TRANSCODE_FAILED, APPROVAL_REQUESTED, APPROVED, REJECTED, PUBLISHING, PUBLISHED, PUBLISH_FAILED`
- `PublishStatus`: `PENDING, RUNNING, COMPLETED, FAILED`

## Current Tech Stack

- **Monorepo:** Bun 1.3.13 workspaces + Turborepo
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 3, hls.js, axios, zod, bcryptjs
- **Auth:** NextAuth Credentials in web, `jose` JWT bridge to Go (`GO_JWT_SECRET`)
- **Web DB client:** Prisma Client from `packages/db` (reads only; do not run Prisma migrate)
- **Backend:** Go `net/http` in `apps/go-api`, `database/sql` + pgx
- **Migrations:** Go-owned SQL in `apps/go-api/migrations`
- **DB:** PostgreSQL
- **Storage:** Amazon S3 (originals + HLS previews), S3 multipart create/sign/complete/abort
- **Queue:** Redis + Asynq (`video:transcode`, `video:publish`)
- **Video:** FFmpeg HLS `360p + 720p`

After changing Go SQL migrations, sync `packages/db/prisma/schema.prisma` and regenerate:

```sh
cd packages/db
bun --bunx prisma generate
```

## Local Development

Bun workspaces + Turborepo.

### Prerequisites

- Node.js 18+
- Bun 1.3.13+
- Go
- PostgreSQL
- Redis
- FFmpeg
- AWS S3 credentials + S3 bucket

### Install

```sh
bun install
```

### Start Web + Deps

```sh
bun run dev
```

Web: `http://localhost:3000`

### Go API (from `apps/go-api`)

```sh
make run          # API server
make run-worker   # Asynq worker (transcode + publish)
make migrate-up
make migrate-down
make migrate-version
make build
make build-worker
```

### Other Repo Scripts

```sh
bun run build
bun run lint
bun run check-types
bun run format
```

Required env (no `.env.example` committed yet — set in `apps/web/.env.local` and `apps/go-api/.env`):

- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`, `GO_JWT_SECRET`
- Go: `DATABASE_URL`, `REDIS_ADDR`, `S3_*` (region/bucket/keys), `GOOGLE_CLIENT_ID/SECRET/REDIRECT`, `WEB_APP_URL`, `TOKEN_ENCRYPTION_KEY`

## Status

In active development. Upload -> preview -> review -> publish vertical slice works end-to-end. Remaining MVP work is metadata/thumbnails, comments/versions, notifications/audit logs, and hardening (retries, progress, cleanup).

Estimated completion of original MVP vision: ~70%.

## Product Positioning

Not cloud storage, not file sharing. A focused approval + publishing workflow: editor handles the large file, creator reviews lightly and keeps channel control, UploadRelay moves the approved original to YouTube.

## Author

Built by **Kishore**.
