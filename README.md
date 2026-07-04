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

The first version focuses on the complete editor-to-YouTube workflow:

- User authentication
- Creator and editor roles
- Workspace creation
- Team invitations
- Large video uploads
- Optimized preview generation
- Thumbnail and metadata submission
- Review, approval, and change requests
- YouTube account connection
- Direct YouTube publishing
- Upload progress and retry handling
- Basic audit logs and notifications

## Monorepo Structure

```text
UploadRelay/
|-- apps/
|   |-- web/       # Frontend application
|   |-- api/       # Backend API
|   `-- worker/    # Background processing and publishing worker
|
|-- packages/
|   |-- ui/                    # Shared UI components
|   |-- eslint-config/         # Shared ESLint configuration
|   `-- typescript-config/     # Shared TypeScript configuration
|
|-- package.json
|-- turbo.json
`-- README.md
```

## Planned Architecture

- **Frontend:** Next.js, React, TypeScript
- **API:** Node.js service for workspaces, uploads, review, approval, and YouTube integration
- **Worker:** Background jobs for video processing, preview generation, and YouTube publishing
- **Storage:** Object storage for original videos, thumbnails, and generated previews
- **Queue:** Reliable background job processing for uploads and publishing
- **Database:** Persistent records for users, workspaces, projects, versions, comments, approvals, and publications

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

### Install Dependencies

```sh
bun install
```

### Start Development

```sh
bun run dev
```

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

Built by **Sabavath Kishore**.
