"use client";

import Link from "next/link";
import {
  Activity,
  CalendarDays,
  Clapperboard,
  Clock3,
  Database,
  Film,
  RefreshCw,
  Send,
  TvMinimalPlay,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { goApi } from "@/lib/go-api";
import type {
  CreatorVideo,
  EditorVideo,
  GetCreatorVideosResponse,
  GetEditorVideosResponse,
} from "@/lib/dashboard/types";
import {
  formatBytes,
  formatDate,
  videoStatusMeta,
} from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";
import { useUploadDialog } from "@/components/upload/upload-dialog-context";
import { CreatorInviteCard } from "./creator-invite-card";
import { LinkCreator } from "./link-creator";
import { VideoCard } from "./video-card";

type Video = EditorVideo | CreatorVideo;

type Metric = {
  label: string;
  hint: string;
  value: number;
  icon: React.ReactNode;
};

export function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const { openUpload, uploadVersion } = useUploadDialog();

  const loadVideos = useCallback(async () => {
    try {
      setErrorMessage("");

      const sessionRes = await fetch("/api/auth/session");
      const session = sessionRes.ok ? await sessionRes.json() : null;
      const role = session?.user?.role ?? "EDITOR";
      setIsCreator(role === "CREATOR");
      const fullName: string =
        session?.user?.name ?? session?.user?.email ?? "";
      setDisplayName(fullName.split(" ")[0] || "there");

      if (role === "CREATOR") {
        const response =
          await goApi.get<GetCreatorVideosResponse>("/videos/creator");
        setVideos(response.data.videos);
      } else {
        const response =
          await goApi.get<GetEditorVideosResponse>("/videos/editor");
        setVideos(response.data.videos);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load videos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos, uploadVersion]);

  useEffect(() => {
    const handler = (event: Event) => {
      const value = (event as CustomEvent<string>).detail ?? "";
      setQuery(value.toLowerCase());
    };
    window.addEventListener("ur:search", handler);
    return () => window.removeEventListener("ur:search", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return videos;
    return videos.filter((video) =>
      `${video.title ?? ""} ${video.originalFileName} ${video.status}`
        .toLowerCase()
        .includes(query.trim()),
    );
  }, [videos, query]);

  const needsReview = videos.filter((video) =>
    ["APPROVAL_REQUESTED", "REJECTED"].includes(video.status),
  ).length;
  const readyCount = videos.filter(
    (video) => video.status === "APPROVED",
  ).length;
  const liveCount = videos.filter((video) =>
    ["PUBLISHED", "PUBLISHING"].includes(video.status),
  ).length;

  const metrics: Metric[] = [
    {
      label: "Total Master Cuts",
      hint: isCreator ? "Cuts awaiting your review" : "All master uploads",
      value: videos.length,
      icon: <Film className="h-4 w-4" aria-hidden="true" />,
    },
    {
      label: "Pending Actions",
      hint:
        needsReview === 0 ? "All sign-offs completed" : "Awaiting creator input",
      value: needsReview,
      icon: <Clock3 className="h-4 w-4" aria-hidden="true" />,
    },
    {
      label: "Ready to Publish",
      hint: "Approved originals",
      value: readyCount,
      icon: <Send className="h-4 w-4" aria-hidden="true" />,
    },
    {
      label: "Live on YouTube",
      hint: "Published channels",
      value: liveCount,
      icon: <TvMinimalPlay className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  const schedule = useMemo(() => filtered.slice(0, 2), [filtered]);
  const activity = useMemo(
    () =>
      [...videos]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 2),
    [videos],
  );

  return (
    <main className="space-y-6" data-purpose="main-dashboard-canvas">
      {/* Hero — obsidian dispatch card */}
      <section
        className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-[#0b0c0e] p-8 text-white shadow-xl md:p-9"
        data-purpose="welcome-banner"
      >
        <div className="striped-render-accent pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-700/60 bg-neutral-900/90 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] text-neutral-300">
              DISPATCH_PIPELINE // ALL NODES HEALTHY
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Welcome back{displayName ? `, ${displayName}` : ""}!
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-neutral-400 md:text-sm">
            Here&apos;s the real-time telemetry of your{" "}
            {isCreator ? "review queue" : "ProRes master deliveries"} and
            YouTube staging pipeline. You have{" "}
            <span className="font-mono font-semibold text-white">
              {needsReview} pending {needsReview === 1 ? "error" : "errors"}
            </span>{" "}
            requiring your attention.
          </p>
          {isCreator ? null : (
            <button
              type="button"
              onClick={openUpload}
              className="smooth-transition mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-neutral-200"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload a master cut
            </button>
          )}
        </div>
        <div className="absolute bottom-8 right-8 z-10 hidden items-center gap-4 font-mono text-[11px] text-neutral-400 sm:flex">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5">
            <span className="text-neutral-500">INGEST PIPE</span>
            <span className="font-semibold text-emerald-400">10 Gbps</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5">
            <span className="text-neutral-500">API</span>
            <span className="font-semibold text-amber-400">DIRECT OAUTH</span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section
        id="stats"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-4"
        data-purpose="metrics-grid"
      >
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="smooth-transition flex flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                {metric.label}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200/60 bg-neutral-100 text-neutral-700">
                {metric.icon}
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-3xl font-bold tracking-tight text-neutral-950">
                {isLoading ? "—" : metric.value}
              </div>
              <p className="font-mono text-xs text-neutral-400">
                {metric.hint}
              </p>
            </div>
          </article>
        ))}
      </section>

      <div id="connect">
        {isCreator ? <CreatorInviteCard /> : <LinkCreator onLinked={loadVideos} />}
      </div>

      {/* Split: schedule + activity */}
      <section
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        data-purpose="lower-dashboard-split"
      >
        <div
          className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] md:p-8 lg:col-span-8"
          data-purpose="upcoming-schedule-container"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-neutral-950">
                {isCreator ? "Review Queue" : "Upcoming Publishing Schedule"}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {isCreator
                  ? "Lightweight previews staged for your sign-off"
                  : "Automated ProRes handoffs and scheduled YouTube publications"}
              </p>
            </div>
            <a
              href="#library"
              className="group flex items-center gap-1 font-mono text-xs font-semibold text-neutral-900 hover:text-neutral-600"
            >
              <span>View All</span>
              <span className="smooth-transition group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </div>

          {isLoading ? (
            <div className="space-y-3.5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl bg-neutral-100"
                />
              ))}
            </div>
          ) : schedule.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-neutral-900">
                No deliveries staged yet
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-neutral-500">
                {isCreator
                  ? "Videos your editors submit will appear here for review."
                  : "Upload your first master cut to stage it for approval."}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {schedule.map((video) => {
                const status = videoStatusMeta(video.status);
                return (
                  <Link
                    key={video.id}
                    href={`/dashboard/videos/${video.id}`}
                    className="smooth-transition flex flex-col justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50/60 md:flex-row md:items-center"
                  >
                    <div className="flex items-start gap-4 md:items-center">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200/60 bg-neutral-100 text-neutral-800">
                        <Clapperboard
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-neutral-900 md:text-sm">
                          {video.title || video.originalFileName}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] text-neutral-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays
                              className="h-3.5 w-3.5 text-neutral-400"
                              aria-hidden="true"
                            />
                            {formatDate(video.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Database
                              className="h-3.5 w-3.5 text-neutral-400"
                              aria-hidden="true"
                            />
                            S3 Staging · Transcode
                          </span>
                          <span className="rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                            {formatBytes(video.originalSize)} Relay
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="self-start md:self-center">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-medium",
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
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div
          id="activity"
          className="flex flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] md:p-8 lg:col-span-4"
          data-purpose="recent-activity-feed"
        >
          <div>
            <h2 className="mb-6 text-base font-bold tracking-tight text-neutral-950">
              Recent Activity
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl bg-neutral-100"
                  />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-xs leading-5 text-neutral-500">
                Activity from uploads, approvals, and publishes will appear
                here.
              </p>
            ) : (
              activity.map((video, index) => {
                const status = videoStatusMeta(video.status);
                return (
                  <div
                    key={video.id}
                    className="relative border-l border-neutral-200 pb-5 pl-6 last:pb-0"
                  >
                    <div
                      className={cn(
                        "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                        index === 0 ? "bg-neutral-900" : "bg-neutral-300",
                      )}
                    />
                    <div className="mb-2.5">
                      <span className="text-xs font-semibold text-neutral-900">
                        {index === 0
                          ? "Live Sign-off Event"
                          : "Pipeline Handshake"}
                      </span>
                      <p className="mt-0.5 font-mono text-[11px] text-neutral-400">
                        {formatDate(video.updatedAt)}
                      </p>
                    </div>
                    <div className="space-y-1.5 rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4 text-xs text-neutral-600">
                      <p className="font-medium leading-snug text-neutral-900">
                        {video.title || video.originalFileName}
                      </p>
                      <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                        <span className="truncate text-neutral-500">
                          {formatBytes(video.originalSize)} ·{" "}
                          {video.originalFileName.split(".").pop()?.toUpperCase()}
                        </span>
                        <span
                          className={cn(
                            "ml-2 shrink-0 rounded border px-1.5 py-0.5 font-semibold",
                            status.chip,
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5 font-mono text-[11px] text-neutral-500">
            <span>Core Dispatch Nodes</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              99.98% SLA
            </span>
          </div>
        </div>
      </section>

      {/* Library */}
      <section id="library" className="scroll-mt-6">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold tracking-tight text-neutral-950">
              {isCreator ? "Videos for review" : "Uploaded videos"}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-neutral-500">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              {isLoading
                ? "Loading your library…"
                : `${filtered.length} video${filtered.length === 1 ? "" : "s"} in relay`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadVideos}
              className="smooth-transition inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-300 hover:text-neutral-950"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </button>
            {isCreator ? null : (
              <button
                type="button"
                onClick={openUpload}
                className="smooth-transition inline-flex h-9 items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Upload a video
              </button>
            )}
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white"
              >
                <div className="aspect-video animate-pulse bg-neutral-100" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Film className="h-5 w-5 text-neutral-600" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-neutral-950">
              {query
                ? "No cuts match your search"
                : isCreator
                  ? "Nothing to review yet"
                  : "No videos uploaded yet"}
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-neutral-500">
              {query
                ? "Try a different title, filename, or status."
                : isCreator
                  ? "Videos your editors submit will appear here for review."
                  : "Upload your first master cut and it will appear here ready for preview and approval."}
            </p>
            {isCreator || query ? null : (
              <button
                type="button"
                onClick={openUpload}
                className="smooth-transition mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Upload your first video
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
