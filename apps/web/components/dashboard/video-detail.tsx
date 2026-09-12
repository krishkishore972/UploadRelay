"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Database,
  FileVideo,
  HardDrive,
  Link2,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { goApi } from "@/lib/go-api";
import type { VideoDetail } from "@/lib/dashboard/types";
import {
  fileExtension,
  formatBytes,
  formatDate,
  initials,
  videoStatusMeta,
} from "@/lib/dashboard/format";
import { playlistUrl } from "@/lib/dashboard/url";
import { cn } from "@/lib/utils";
import { HlsPlayer } from "@/components/videos/hls-player";

function DetailRow({
  icon,
  label,
  children,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="flex items-center gap-2 text-xs text-text-500">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "max-w-[60%] truncate text-right text-xs font-medium text-text-900",
          mono && "font-mono text-[11px]",
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function VideoDetail({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      if (!r.ok) return;
      const session = await r.json();
      setIsCreator(session?.user?.role === "CREATOR");
    });
  }, []);

  async function act(path: "submit" | "approve" | "reject") {
    setActing(true);
    try {
      await goApi.post(`/videos/${videoId}/${path}`);
      const response = await goApi.get<VideoDetail>(`/videos/${videoId}`);
      setVideo(response.data);
    } catch (error) {
      console.error(error);
      alert("Action failed. Check video status and your role.");
    } finally {
      setActing(false);
    }
  }

  useEffect(() => {
    async function loadVideo() {
      try {
        setErrorMessage("");

        const response = await goApi.get<VideoDetail>(`/videos/${videoId}`);

        setVideo(response.data);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load video.");
      } finally {
        setIsLoading(false);
      }
    }

    loadVideo();
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-12">
        <div className="h-5 w-32 animate-pulse rounded bg-background-200" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="aspect-video animate-pulse rounded-2xl bg-background-200" />
          <div className="h-80 animate-pulse rounded-2xl bg-background-200" />
        </div>
      </div>
    );
  }

  if (errorMessage || !video) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      </div>
    );
  }

  const status = videoStatusMeta(video.status);
  const src = video.masterPlaylistKey
    ? playlistUrl(video.masterPlaylistKey)
    : "";
  const creator = video.creator;
  const channel = video.creator.channel;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-600 transition-colors hover:text-text-950"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Dashboard
        </Link>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            status.chip,
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status.dot,
              status.pulse && "animate-pulse",
            )}
          />
          {status.label}
        </span>
      </div>

      {video.status === "PREVIEW_READY" && !isCreator ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={acting}
            onClick={() => act("submit")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-700 px-5 text-sm font-semibold text-text-50 transition-colors hover:bg-primary-800 disabled:opacity-50"
          >
            {acting ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      ) : null}

      {video.status === "APPROVAL_REQUESTED" && isCreator ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={acting}
            onClick={() => act("approve")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {acting ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => act("reject")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            {acting ? "Rejecting…" : "Request changes"}
          </button>
        </div>
      ) : null}

      <h1 className="mt-6 max-w-3xl text-2xl font-semibold tracking-tight text-text-950 sm:text-3xl">
        {video.title || video.originalFileName}
      </h1>
      <p className="mt-1 text-sm text-text-600">{video.originalFileName}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-background-200 bg-neutral-950 shadow-sm">
            {src ? (
              <HlsPlayer src={src} className="!rounded-none" />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 text-neutral-500">
                <RefreshCw className="size-6 animate-spin" aria-hidden="true" />
                <p className="text-sm">
                  Preview is being generated. Check back shortly.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetaStat
              icon={<FileVideo className="size-4" aria-hidden="true" />}
              label="Format"
              value={fileExtension(video.originalFileName)}
            />
            <MetaStat
              icon={<HardDrive className="size-4" aria-hidden="true" />}
              label="Size"
              value={formatBytes(video.originalSize)}
            />
            <MetaStat
              icon={<CalendarDays className="size-4" aria-hidden="true" />}
              label="Uploaded"
              value={formatDate(video.createdAt)}
            />
            <MetaStat
              icon={<Database className="size-4" aria-hidden="true" />}
              label="Storage"
              value="S3 · Transcode"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-background-200 bg-background-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-950">
              <FileVideo className="size-4 text-primary-700" aria-hidden="true" />
              File details
            </h2>
            <div className="mt-2 divide-y divide-background-200">
              <DetailRow icon={<FileVideo className="size-3.5" aria-hidden="true" />} label="Mime type">
                {video.originalMimeType || "Unknown"}
              </DetailRow>
              <DetailRow icon={<CalendarDays className="size-3.5" aria-hidden="true" />} label="Created">
                {formatDate(video.createdAt)}
              </DetailRow>
              <DetailRow icon={<RefreshCw className="size-3.5" aria-hidden="true" />} label="Last updated">
                {formatDate(video.updatedAt)}
              </DetailRow>
              <DetailRow icon={<Database className="size-3.5" aria-hidden="true" />} label="Storage key" mono>
                {video.originalS3Key}
              </DetailRow>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-background-200 bg-background-100 p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-950">
              <UserIcon className="size-4 text-primary-700" aria-hidden="true" />
              Publishing target
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700/10 text-sm font-bold text-primary-700">
                {initials(creator.name, creator.email)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-950">
                  {creator.name || "Creator"}
                </p>
                <p className="truncate text-xs text-text-600">{creator.email}</p>
              </div>
              <span className="ml-auto rounded-full border border-background-200 bg-background-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-600">
                {creator.role}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-background-200 bg-background-50 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-text-900">
                  <Link2 className="size-3.5 text-primary-700" aria-hidden="true" />
                  YouTube channel
                </span>
                {channel?.connected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-background-200 bg-background-100 px-2 py-0.5 text-[10px] font-semibold text-text-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                    Not connected
                  </span>
                )}
              </div>

              {channel?.connected ? (
                <div className="mt-3">
                  <p className="truncate text-sm font-semibold text-text-950">
                    {channel.channelTitle || "Untitled channel"}
                  </p>
                  {channel.channelId ? (
                    <p className="mt-0.5 font-mono text-[11px] text-text-600">
                      {channel.channelId}
                    </p>
                  ) : null}
                  {channel.googleAccountEmail ? (
                    <p className="mt-1 truncate text-[11px] text-text-500">
                      {channel.googleAccountEmail}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-text-600">
                  This creator has not linked a YouTube channel yet. Publishing
                  will wait until a connection is added.
                </p>
              )}
            </div>

            {/* Placeholder (post-MVP): direct YouTube publishing + OAuth connect.
                Per README, publishing is not in the working vertical slice yet. */}
            {video.status === "APPROVED" ? (
              <p className="mt-3 rounded-xl border border-dashed border-background-200 bg-background-50 p-3 text-[11px] leading-5 text-text-500">
                Approved — direct publish to YouTube lands here next (OAuth +
                publish worker).
              </p>
            ) : null}

            {/* Placeholder (post-MVP): comment thread + version history land here. */}
          </div>

          <div className="rounded-2xl border border-background-200 bg-background-100 p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-950">
              <ShieldCheck className="size-4 text-primary-700" aria-hidden="true" />
              Transfer state
            </h2>
            <div className="mt-2 divide-y divide-background-200">
              <DetailRow icon={<FileVideo className="size-3.5" aria-hidden="true" />} label="Status">
                {status.label}
              </DetailRow>
              <DetailRow icon={<Database className="size-3.5" aria-hidden="true" />} label="Original">
                {video.originalS3Key.length > 0 ? "In vault" : "Pending"}
              </DetailRow>
              <DetailRow icon={<RefreshCw className="size-3.5" aria-hidden="true" />} label="Preview">
                {video.masterPlaylistKey ? "HLS ready" : "Generating"}
              </DetailRow>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetaStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-background-200 bg-background-100 p-3">
      <span className="flex items-center gap-1.5 text-[11px] text-text-500">
        {icon}
        {label}
      </span>
      <p className="mt-1 truncate text-sm font-semibold text-text-950">
        {value}
      </p>
    </div>
  );
}