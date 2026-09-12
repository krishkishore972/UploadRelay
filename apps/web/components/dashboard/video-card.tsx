"use client";

import Link from "next/link";
import { ArrowUpRight, Film } from "lucide-react";

import type { CreatorVideo, EditorVideo } from "@/lib/dashboard/types";
import {
  fileExtension,
  formatBytes,
  formatDate,
  videoStatusMeta,
} from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

type CardVideo = EditorVideo | CreatorVideo;

function counterpart(video: CardVideo): string | null {
  if ("editorEmail" in video && video.editorEmail) {
    return video.editorName
      ? `${video.editorName} · ${video.editorEmail}`
      : video.editorEmail;
  }
  return null;
}

export function VideoCard({ video }: { video: CardVideo }) {
  const status = videoStatusMeta(video.status);
  const from = counterpart(video);

  return (
    <Link
      href={`/dashboard/videos/${video.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-background-200 bg-background-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-background-300 hover:shadow-xl"
    >
      {/* Static thumb. Hover-autoplay previews removed: review happens on the
          detail page HLS player (MVP). Previews arrive per-card post-MVP. */}
      <div className="relative flex aspect-video flex-col justify-between bg-gradient-to-br from-neutral-800 via-neutral-900 to-black p-3">
        <div className="flex items-start justify-between">
          <span className="rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-neutral-300">
            {fileExtension(video.originalFileName)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
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

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-neutral-400">
              {formatDate(video.createdAt)}
            </p>
            <p className="text-sm font-semibold text-neutral-200">
              {formatBytes(video.originalSize)}
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400">
            <Film className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-text-950">
            {video.title || video.originalFileName}
          </h3>
          <ArrowUpRight
            className="mt-0.5 size-4 shrink-0 text-text-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-700"
            aria-hidden="true"
          />
        </div>
        <p className="line-clamp-1 text-xs text-text-600">
          {video.originalFileName}
        </p>
        {from ? (
          <p className="line-clamp-1 text-[11px] text-text-500">
            From {from}
          </p>
        ) : null}
        <p className="mt-auto text-[11px] text-text-400">
          Uploaded {formatDate(video.createdAt)}
        </p>
      </div>
    </Link>
  );
}
