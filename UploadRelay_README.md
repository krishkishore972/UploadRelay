# UploadRelay

**Upload once. Review anywhere. Publish securely.**

UploadRelay is a collaborative video review and publishing platform built for YouTube creators and their editing teams.

Editors upload the final video, thumbnail, title, description, and publishing details to UploadRelay. The creator reviews everything, requests changes when needed, and approves the final submission. After approval, UploadRelay uploads the original video directly to the creator's connected YouTube channel.

This removes the need for creators to download and re-upload large video files, especially when travelling or working with slow internet connections.

---

## Problem

Many YouTube creators work with remote video editors.

A typical workflow looks like this:

1. The editor finishes the video.
2. The editor uploads the large file to cloud storage.
3. The creator downloads the file.
4. The creator checks the video and metadata.
5. The creator manually uploads the same file to YouTube.

This process creates several problems:

- The creator must download and upload very large files.
- Slow or unstable internet can delay publishing.
- Editors may require direct access to the creator's channel.
- Feedback is scattered across chat, email, and cloud storage.
- Version management becomes difficult.
- There is no structured approval trail.

---

## Solution

UploadRelay provides one secure workflow:

```text
Editor uploads video and metadata
              ↓
UploadRelay generates a reviewable preview
              ↓
Creator reviews and leaves timestamped feedback
              ↓
Editor uploads a revised version if required
              ↓
Creator approves the final version
              ↓
UploadRelay uploads the original file to YouTube
```

The creator only needs enough internet bandwidth to watch a compressed preview and approve the submission.

---

## Core Features

### Creator workspace

- Create and manage workspaces
- Connect a YouTube channel securely
- Invite editors and reviewers
- Review video submissions
- Approve videos or request changes
- Control YouTube publishing settings
- Track upload and publishing progress

### Editor workflow

- Upload large video files
- Add title, description, tags, and thumbnail
- Submit videos for review
- Receive timestamped feedback
- Upload revised versions
- Track approval status

### Review and approval

- Browser-based video preview
- Timestamped comments
- Version history
- Approval status tracking
- Activity and audit logs
- Role-based permissions

### YouTube publishing

- Google OAuth connection
- Resumable uploads
- Thumbnail upload
- Title and description publishing
- Visibility settings
- Playlist support
- Scheduled publishing
- Retry and failure recovery

---

## MVP Scope

The first version focuses on the complete editor-to-YouTube workflow.

- User authentication
- Creator and editor roles
- Workspace creation
- Team invitations
- Large multipart video uploads
- Thumbnail and metadata submission
- Video preview generation
- Timestamped comments
- Version management
- Approve or request changes
- YouTube account connection
- Direct YouTube publishing
- Upload progress and retry handling
- Email notifications
- Basic audit logs

---

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- HLS.js
- React Hook Form
- Zod

### Backend

- Node.js
- Express, Fastify, or Hono
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ

### Video and storage

- Amazon S3 or Cloudflare R2
- Multipart uploads
- Presigned URLs
- FFmpeg
- FFprobe
- HLS preview generation

### Integrations

- Google OAuth 2.0
- YouTube Data API
- Resend for email notifications
- Sentry for monitoring

### Deployment

- Vercel for the web application
- AWS EC2, ECS, Railway, or Render for the API and workers
- Managed PostgreSQL
- Managed Redis

---

## Proposed Monorepo Structure

```text
uploadrelay/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # Backend API
│   └── worker/              # Video processing and publishing workers
│
├── packages/
│   ├── database/            # Prisma schema and database client
│   ├── auth/                # Authentication and authorization helpers
│   ├── storage/             # S3/R2 upload utilities
│   ├── queue/               # Redis and BullMQ configuration
│   ├── validation/          # Shared Zod schemas
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared TypeScript and lint configuration
│
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

---

## Main Application Flow

### 1. Workspace creation

The creator creates a workspace and invites editors or reviewers.

### 2. Video project creation

The editor creates a video project and adds:

- Video file
- Thumbnail
- Title
- Description
- Tags
- Visibility
- Playlist
- Audience settings
- Optional scheduled publish time

### 3. Large file upload

The browser uploads the original video directly to object storage using multipart uploads and presigned URLs.

### 4. Video processing

A background worker:

- Reads video metadata
- Generates a compressed preview
- Generates HLS files
- Extracts a poster frame
- Updates processing progress

### 5. Review

The creator watches the preview, checks the metadata, and leaves timestamped comments.

### 6. Revision

The editor uploads another version while previous versions and comments remain available.

### 7. Approval

The creator approves the final version.

### 8. YouTube publishing

A background worker uploads the original file to the creator's YouTube channel using a resumable upload session.

---

## Project Status Flow

```text
DRAFT
  ↓
UPLOADING
  ↓
PROCESSING
  ↓
READY_FOR_REVIEW
  ↓
CHANGES_REQUESTED
  ↓
READY_FOR_REVIEW
  ↓
APPROVED
  ↓
QUEUED_FOR_YOUTUBE
  ↓
UPLOADING_TO_YOUTUBE
  ↓
YOUTUBE_PROCESSING
  ↓
PUBLISHED
```

Additional states:

```text
UPLOAD_FAILED
PROCESSING_FAILED
PUBLISH_FAILED
CANCELLED
ARCHIVED
```

---

## Core Database Models

```text
User
Workspace
WorkspaceMember
Invitation
YouTubeConnection
VideoProject
VideoVersion
Thumbnail
ReviewComment
Approval
Publication
AuditLog
UploadSession
ProcessingJob
```

### Workspace roles

```text
OWNER
REVIEWER
EDITOR
```

---

## Example Environment Variables

Create a `.env` file based on `.env.example`.

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uploadrelay

# Authentication
AUTH_SECRET=replace-with-a-secure-secret

# Google and YouTube
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/youtube/callback

# Object storage
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=

# Redis
REDIS_URL=redis://localhost:6379

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Monitoring
SENTRY_DSN=

# Encryption
TOKEN_ENCRYPTION_KEY=
```

Never commit real credentials or OAuth tokens.

---

## Local Development

### Prerequisites

Install:

- Node.js 20 or newer
- pnpm
- Docker
- PostgreSQL
- Redis
- FFmpeg

### Clone the repository

```bash
git clone https://github.com/your-username/uploadrelay.git
cd uploadrelay
```

### Install dependencies

```bash
pnpm install
```

### Start local infrastructure

```bash
docker compose up -d
```

### Configure environment variables

```bash
cp .env.example .env
```

Update the values inside `.env`.

### Run database migrations

```bash
pnpm db:migrate
```

### Seed the database

```bash
pnpm db:seed
```

### Start all applications

```bash
pnpm dev
```

Expected local services:

```text
Web application: http://localhost:3000
API server:      http://localhost:4000
PostgreSQL:      localhost:5432
Redis:           localhost:6379
```

---

## Planned Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

---

## API Overview

Planned API groups:

```text
/api/auth
/api/workspaces
/api/invitations
/api/projects
/api/versions
/api/uploads
/api/comments
/api/approvals
/api/youtube
/api/publications
/api/audit-logs
```

Example upload endpoints:

```text
POST /api/uploads/create
POST /api/uploads/sign-part
POST /api/uploads/complete
POST /api/uploads/abort
```

Example approval endpoints:

```text
POST /api/projects/:projectId/submit
POST /api/projects/:projectId/request-changes
POST /api/projects/:projectId/approve
```

---

## Security Principles

UploadRelay handles private videos and YouTube authorization tokens, so security is a core requirement.

- Never request a creator's Google password
- Use Google OAuth 2.0
- Encrypt refresh tokens before storing them
- Use short-lived signed URLs
- Keep original videos private
- Validate workspace membership on every protected endpoint
- Validate MIME type and file size
- Use secure, HTTP-only cookies
- Add rate limiting
- Protect against IDOR vulnerabilities
- Record sensitive actions in audit logs
- Support account and workspace deletion
- Prevent duplicate YouTube uploads with idempotency keys

---

## Reliability Requirements

- Multipart uploads must support retry and resume
- Processing jobs must be idempotent
- Publishing jobs must never create duplicate videos
- Failed jobs must be retryable
- YouTube resumable upload sessions should be persisted
- Worker shutdown must be graceful
- Upload and processing progress must be stored
- Incomplete multipart uploads should be cleaned automatically

---

## Roadmap

### Phase 1 — MVP

- Authentication
- Workspaces and team roles
- Multipart video upload
- Metadata and thumbnail submission
- Preview generation
- Review and approval
- YouTube OAuth
- Direct YouTube publishing

### Phase 2 — Collaboration

- Timestamped comments
- Replies and mentions
- Multiple versions
- Approval checklists
- Advanced notifications
- Workspace activity feed

### Phase 3 — Creator productivity

- Reusable description templates
- Channel publishing defaults
- AI-generated titles and descriptions
- Automatic chapters
- Subtitle upload
- Thumbnail comparison
- Multi-channel management

### Phase 4 — Agency features

- Multiple client workspaces
- Multi-step approval workflows
- White-label review pages
- Team analytics
- Storage controls
- Subscription billing

---

## Features Intentionally Excluded from the MVP

To keep the first release focused, these features will be postponed:

- Full browser-based video editing
- Native mobile applications
- Automatic copyright detection
- Advanced YouTube analytics
- AI chapter generation
- Multi-platform publishing
- WhatsApp integration
- White-labeling
- Complex billing
- Real-time collaborative editing

---

## Development Milestones

### Week 1

- Authentication
- Workspaces
- Team invitations
- Role-based access
- Dashboard

### Week 2

- Video project creation
- Multipart uploads
- Object storage
- Thumbnail upload
- Preview processing

### Week 3

- Review page
- Timestamped comments
- Version management
- Approval workflow
- YouTube publishing

### Week 4

- Reliability
- Security
- Testing
- Monitoring
- Production deployment
- Beta preparation

---

## Definition of MVP Complete

The MVP is ready for beta testing when:

- A creator can create a workspace
- A creator can invite an editor
- An editor can upload a large video
- The editor can add metadata and a thumbnail
- The platform generates a preview
- The creator can leave feedback
- The editor can upload a revision
- The creator can approve the final version
- The creator can connect a YouTube channel
- UploadRelay can publish the original video to YouTube
- Users can track publishing progress
- Failed jobs can be retried safely
- Private files and OAuth tokens are protected

---

## Product Positioning

UploadRelay is not just another file-sharing platform.

It is a structured approval and publishing workflow designed specifically for creators and their editors.

> The editor handles the large file.  
> The creator keeps control of the channel.  
> UploadRelay handles everything between approval and publishing.

---

## Contributing

This project is currently in the early development stage.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add or update tests.
5. Run linting and type checking.
6. Submit a pull request.

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

---

## License

The license has not yet been finalized.

Until a license is added, all rights are reserved by the project owner.

---

## Author

Built by **Sabavath Kishore**.

---

## Tagline

**Upload once. Review anywhere. Publish securely.**
