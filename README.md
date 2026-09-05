# UploadRelay

**Upload once. Review anywhere. Publish directly to YouTube.**

UploadRelay is a cloud-based collaboration and publishing platform for content creators, video editors, media teams, and agencies. It removes the slowest part of the post-production handoff: forcing a creator to download a huge final video file, review it, and upload the same file again to YouTube.

Instead, the editor uploads the final high-quality video once to UploadRelay. The creator reviews a lightweight optimized preview using minimal data, approves the video, and publishes it directly to their connected YouTube channel. UploadRelay transfers the original high-quality file from cloud infrastructure to YouTube, so the creator never has to download or re-upload the video.

## The Problem

Modern video teams often work remotely. A common YouTube publishing workflow looks like this:

1. A video editor finishes the final cut.
2. The editor uploads a large video file to cloud storage.
3. The creator downloads the file to review it.
4. The creator requests changes or approves it.
5. The creator uploads the same large file again to YouTube.

This becomes painful when final files are 5 GB, 10 GB, or larger. It is especially difficult when the creator is travelling, using mobile data, working from a slow connection, or publishing under a deadline.

UploadRelay is designed to make that workflow faster, lighter, and more secure.

## The Solution

UploadRelay acts as a trusted layer between editors and creators:

```text
Editor uploads the final video once
              |
UploadRelay stores the original file securely
              |
UploadRelay generates an optimized review preview
              |
Creator reviews the preview with minimal data usage
              |
Creator approves the final version
              |
UploadRelay publishes the original file to YouTube
```

The creator keeps control of their YouTube channel, while the editor does not need direct channel access and the original file does not need to travel through the creator's device.

## Who It Is For

- YouTube creators working with remote editors
- Video editors delivering large final files
- Creator teams managing review and approval
- Agencies producing content for client channels
- Media teams that need a clear approval trail before publishing

## Core Features

### Creator Review

- Review optimized video previews in the browser
- Approve final videos without downloading the original file
- Request changes from editors
- Review title, description, thumbnail, tags, and publishing settings
- Track publishing status

### Editor Handoff

- Upload large original video files
- Add YouTube metadata and thumbnail assets
- Submit videos for creator review
- Upload revised versions when changes are requested
- Keep the handoff structured in one workspace

### YouTube Publishing

- Connect creator YouTube channels through Google OAuth
- Publish approved videos directly to YouTube
- Transfer the original high-quality file from cloud storage
- Support upload progress, retries, and failure recovery
- Keep publishing actions tied to an approval flow

### Collaboration And Security

- Workspace-based creator/editor roles
- Review and approval status tracking
- Version history
- Activity logs
- Private storage for original files
- Secure handling of YouTube authorization tokens

## MVP Scope

The first version is being built toward the complete editor-to-YouTube workflow:

- User authentication
- Creator and editor roles
- Large video uploads
- Optimized preview generation
- Review, approval, and change requests
- YouTube account connection
- Direct YouTube publishing
- Upload progress and failure recovery

Workspace creation, team invitations, metadata review, thumbnail upload, publishing, audit logs, and notifications are planned but not part of the currently working vertical slice yet.

## Monorepo Structure

```text
UploadRelay/
|-- apps/
|   |-- web/       # Next.js frontend and auth routes
|   `-- go-api/    # Go API, SQL migrations, and Asynq worker
|
|-- packages/
|   |-- db/                    # Prisma client used by the Next.js app for DB queries
|   |-- ui/                    # Shared UI components
|   |-- eslint-config/         # Shared ESLint configuration
|   `-- typescript-config/     # Shared TypeScript configuration
|
|-- package.json
|-- turbo.json
`-- README.md
```

## Current Tech Stack

- **Monorepo:** Bun workspaces and Turborepo
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Authentication:** NextAuth in the web app, with a Go JWT bridge for upload API calls
- **Web database client:** Prisma Client from `packages/db`
- **Backend API:** Go HTTP server in `apps/go-api`
- **Database migrations:** Go-owned SQL migrations in `apps/go-api/migrations`
- **Database driver:** `database/sql` with pgx
- **Database:** PostgreSQL
- **Object storage:** Amazon S3 for original uploads and generated previews
- **Multipart upload:** Go API creates, signs, completes, and aborts S3 multipart uploads
- **Queue:** Redis-backed Asynq
- **Worker:** Go Asynq worker for FFmpeg preview generation
- **Video processing:** FFmpeg HLS previews

Prisma is used by the Next.js app as a typed query client. Database schema changes should be applied through the Go migration files to keep one migration source of truth, then Prisma Client should be regenerated from the synced Prisma schema.

## MVP Progress

Current state:

- Implemented: landing page and upload page shell.
- Implemented: email/password registration and login flow in the web app.
- Implemented: Prisma client package for web-side auth/database queries.
- Implemented: Go API service with authenticated S3 multipart upload endpoints.
- Implemented: SQL migrations for users, videos, YouTube connections, publish jobs, and upload-aborted video status.
- Implemented: browser-to-S3 multipart upload flow with progress tracking.
- Implemented: upload abort fallback from the web app.
- Implemented: Redis/Asynq queue wiring for background transcode jobs.
- Implemented: Go worker that downloads the original from S3, generates HLS preview renditions with FFmpeg, uploads previews to S3, and updates video transcode status.
- Partially implemented: creator/editor model. Current upload flow still sets both `editorId` and `creatorId` to the logged-in user for solo MVP testing.
- Partially implemented: video status lifecycle. Upload and preview generation statuses exist, but review, approval, and publishing states are not wired to user-facing workflows yet.
- Not implemented yet: workspace creation and invitations.
- Not implemented yet: creator review page, comments, approvals, and change requests.
- Not implemented yet: YouTube OAuth connection flow.
- Not implemented yet: direct YouTube publishing worker.
- Not implemented yet: metadata/thumbnail submission and review.
- Not implemented yet: audit logs and notifications.

Estimated MVP completion: about 40-45%.

The upload and preview-generation backbone is now the strongest part of the product. The remaining MVP work is mostly product workflow: connecting creators and editors, letting a creator review a generated preview, approving/rejecting, then publishing to YouTube.

## Recommended Next Target

The next best target is the creator review flow:

1. Add a video detail/review API or web route that loads a video by `videoId`, checks ownership, and returns title, status, original metadata, and preview keys.
2. Build a review page that plays the generated HLS preview from S3.
3. Add basic approve/reject actions that move `PREVIEW_READY` videos into `APPROVED` or `REJECTED`.
4. After approval works, start YouTube OAuth and publishing.

This keeps momentum on the vertical slice: upload original, generate preview, review preview, approve, publish.

## Main Workflow

1. The creator creates a workspace and connects a YouTube channel.
2. The creator invites an editor.
3. The editor uploads the original video file and publishing metadata.
4. UploadRelay generates a lightweight preview.
5. The creator reviews the preview and metadata.
6. The creator approves the video or requests changes.
7. UploadRelay publishes the approved original file to YouTube.
8. The creator and editor can track publishing progress.

## Local Development

This repository uses Bun workspaces and Turborepo.

### Prerequisites

- Node.js 18 or newer
- Bun 1.3.13 or newer
- Go
- PostgreSQL database
- Redis
- FFmpeg
- AWS credentials with S3 access

### Install Dependencies

```sh
bun install
```

### Start Development

```sh
bun run dev
```

### Go API Local Development

Run these commands from `apps/go-api`.

Start the API server:

```sh
make run
```

Start the background worker:

```sh
make run-worker
```

Build the API server binary:

```sh
make build
```

Build the worker binary:

```sh
make build-worker
```

Apply database migrations:

```sh
make migrate-up
```

Roll back one migration:

```sh
make migrate-down
```

Check migration version:

```sh
make migrate-version
```

After changing Go-owned SQL migrations, keep `packages/db/prisma/schema.prisma` in sync and regenerate the Prisma client:

```sh
cd packages/db
bun --bunx prisma generate
```

Do not run Prisma migrations unless migration ownership is intentionally moved from Go SQL migrations to Prisma.

### Build

```sh
bun run build
```

### Lint

```sh
bun run lint
```

### Check Types

```sh
bun run check-types
```

### Format

```sh
bun run format
```

## Package Scripts

```json
{
  "build": "turbo run build",
  "dev": "turbo run dev",
  "lint": "turbo run lint",
  "format": "prettier --write \"**/*.{ts,tsx,md}\"",
  "check-types": "turbo run check-types"
}
```

## Product Positioning

UploadRelay is not just cloud storage and it is not a general file-sharing tool. It is a focused approval and publishing workflow for creator teams.

The editor handles the large file. The creator reviews lightly and keeps control. UploadRelay moves the approved original video from the cloud to YouTube.

## Status

UploadRelay is in early development.

## Author

Built by **Kishore**.
