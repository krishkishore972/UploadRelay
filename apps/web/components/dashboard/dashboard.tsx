"use client";

import { Clock3, Film, Send, TvMinimalPlay, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { goApi } from "@/lib/go-api";
import type {
  CreatorVideo,
  EditorVideo,
  GetCreatorVideosResponse,
  GetEditorVideosResponse,
} from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { useUploadDialog } from "@/components/upload/upload-dialog-context";
import { CreatorInviteCard } from "./creator-invite-card";
import { LinkCreator } from "./link-creator";
import { VideoCard } from "./video-card";

type DashboardStats = {
  label: string;
  hint: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
};

export function Dashboard() {
  const [videos, setVideos] = useState<(EditorVideo | CreatorVideo)[]>([]);
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
      const creatorMode = role === "CREATOR";
      setIsCreator(creatorMode);

      if (creatorMode) {
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

  const stats: DashboardStats[] = [
    {
      label: "Total videos",
      hint: "All master uploads",
      value: videos.length,
      icon: <Film className="size-4" aria-hidden="true" />,
      iconClass: "bg-primary-700/10 text-primary-700",
    },
    {
      label: "Needs review",
      hint: "Awaiting creator input",
      value: videos.filter((video) =>
        ["APPROVAL_REQUESTED", "REJECTED"].includes(video.status),
      ).length,
      icon: <Clock3 className="size-4" aria-hidden="true" />,
      iconClass: "bg-amber-500/10 text-amber-700",
    },
    {
      label: "Ready to publish",
      hint: "Approved originals",
      value: videos.filter((video) => video.status === "APPROVED").length,
      icon: <Send className="size-4" aria-hidden="true" />,
      iconClass: "bg-emerald-500/10 text-emerald-700",
    },
    {
      label: "Live on YouTube",
      hint: "Published channels",
      value: videos.filter((video) =>
        ["PUBLISHED", "PUBLISHING"].includes(video.status),
      ).length,
      icon: <TvMinimalPlay className="size-4" aria-hidden="true" />,
      iconClass: "bg-red-500/10 text-red-600",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-12">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
            {isCreator ? "Creator dashboard" : "Editor dashboard"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-950 sm:text-4xl">
            {isCreator ? "Review queue" : "Your master cuts"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-600">
            {isCreator
              ? "Review lightweight previews, approve final cuts, and publish to YouTube."
              : "Every original you uploaded, preview-ready and staged for creator approval and YouTube publishing."}
          </p>
        </div>

        {isCreator ? null : (
          <button
            type="button"
            onClick={openUpload}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-700 px-5 text-sm font-semibold text-text-50 shadow-lg shadow-primary-700/20 transition-colors hover:bg-primary-800"
          >
            <UploadCloud className="size-4" aria-hidden="true" />
            Upload a video
          </button>
        )}
      </header>

      <div className="mt-8">
        {isCreator ? <CreatorInviteCard /> : <LinkCreator onLinked={loadVideos} />}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-background-200 bg-background-100 p-4 shadow-sm"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                stat.iconClass,
              )}
            >
              {stat.icon}
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-text-950">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-text-900">
              {stat.label}
            </p>
            <p className="text-[11px] text-text-500">{stat.hint}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-text-950">
              {isCreator ? "Videos for review" : "Uploaded videos"}
            </h2>
            <p className="text-xs text-text-600">
              {isLoading
                ? "Loading your library…"
                : `${videos.length} video${videos.length === 1 ? "" : "s"} in relay`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadVideos}
              className="rounded-lg border border-background-200 bg-background-100 px-3 py-2 text-xs font-medium text-text-700 transition-colors hover:border-background-300 hover:text-text-950"
            >
              Refresh
            </button>
            {isCreator ? null : (
              <button
                type="button"
                onClick={openUpload}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 text-xs font-semibold text-text-50 transition-colors hover:bg-primary-800"
              >
                <UploadCloud className="size-4" aria-hidden="true" />
                Upload a video
              </button>
            )}
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-background-200 bg-background-100"
              >
                <div className="aspect-video animate-pulse bg-background-200" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-background-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-background-200" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-background-300 bg-background-100/60 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700/10">
              <Film className="size-5 text-primary-700" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-text-950">
              {isCreator ? "Nothing to review yet" : "No videos uploaded yet"}
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-text-600">
              {isCreator
                ? "Videos your editors submit will appear here for review."
                : "Upload your first master cut and it will appear here ready for preview and approval."}
            </p>
            {isCreator ? null : (
              <button
                type="button"
                onClick={openUpload}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 text-sm font-semibold text-text-50 transition-colors hover:bg-primary-800"
              >
                <UploadCloud className="size-4" aria-hidden="true" />
                Upload your first video
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}