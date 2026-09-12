"use client";

import {
  Clock3,
  Film,
  RefreshCw,
  Send,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { goApi } from "@/lib/go-api";
import {
  type CreatorVideo,
  type EditorVideo,
  type GetCreatorVideosResponse,
  type GetEditorVideosResponse,
} from "@/lib/dashboard/types";
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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { openUpload, uploadVersion } = useUploadDialog();

  const loadVideos = useCallback(async () => {
    try {
      setErrorMessage("");

      const sessionRes = await fetch("/api/auth/session");
      const session = sessionRes.ok ? await sessionRes.json() : null;
      const role = session?.user?.role ?? "EDITOR";
      setIsCreator(role === "CREATOR");

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

  const needsReview = videos.filter((video) =>
    ["APPROVAL_REQUESTED", "REJECTED"].includes(video.status),
  ).length;
  const approvedCount = videos.filter(
    (video) => video.status === "APPROVED",
  ).length;

  // MVP metrics only: total, needs-review, approved.
  // Publishing stats (PUBLISHING/PUBLISHED) arrive with YouTube publishing (post-MVP).
  const metrics: Metric[] = [
    {
      label: isCreator ? "Cuts For Review" : "Total Master Cuts",
      hint: isCreator ? "Submitted to you" : "All master uploads",
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
      label: "Approved",
      hint: "Cleared for publishing",
      value: approvedCount,
      icon: <Send className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  return (
    <main className="space-y-6" data-purpose="main-dashboard-canvas">
      {/* Header */}
      <section data-purpose="welcome-banner">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {isCreator ? "Creator Portal" : "Studio Portal"}
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950 md:text-3xl">
              {isCreator ? "Review queue" : "Your master cuts"}
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-500">
              {isCreator
                ? "Review lightweight previews, approve final cuts, and publish to YouTube."
                : "Upload originals once. Creators review lightweight previews — no downloads, no re-uploads."}
            </p>
          </div>
          {isCreator ? null : (
            <button
              type="button"
              onClick={openUpload}
              className="smooth-transition inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload a master cut
            </button>
          )}
        </div>
      </section>

      {/* Metrics */}
      <section
        id="stats"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5"
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

      {/* Placeholder (post-MVP): activity feed from audit logs, publishing schedule.
          Per README, audit logs / notifications / publishing UI are not in the vertical slice yet. */}
      {/* Library */}
      <section id="library" className="scroll-mt-6">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold tracking-tight text-neutral-950">
              {isCreator ? "Videos for review" : "Uploaded videos"}
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
              {isLoading
                ? "Loading your library…"
                : `${videos.length} video${videos.length === 1 ? "" : "s"} in relay`}
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
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Film className="h-5 w-5 text-neutral-600" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-neutral-950">
              {isCreator ? "Nothing to review yet" : "No videos uploaded yet"}
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-neutral-500">
              {isCreator
                ? "Videos your editors submit will appear here for review."
                : "Upload your first master cut and it will appear here ready for preview and approval."}
            </p>
            {isCreator ? null : (
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
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
