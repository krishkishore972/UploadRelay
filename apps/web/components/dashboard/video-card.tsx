"use client";

import Link from "next/link";
import { ArrowUpRight, Film, Play } from "lucide-react";
import { useState } from "react";

import type { EditorVideo } from "@/lib/dashboard/types";
import {
  fileExtension,
  formatBytes,
  formatDate,
  videoStatusMeta,
} from "@/lib/dashboard/format";
import { playlistUrl } from "@/lib/dashboard/url";
import { cn } from "@/lib/utils";
import { HlsPlayer } from "@/components/videos/hls-player";

export function VideoCard({ video }: { video: EditorVideo }) {
  const [previewActive, setPreviewActive] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  const src = video.masterPlaylistKey
    ? playlistUrl(video.masterPlaylistKey)
    : "";
  const status = videoStatusMeta(video.status);

  return (
    <Link
      href={`/dashboard/videos/${video.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-background-200 bg-background-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-background-300 hover:shadow-xl"
    >
      <div
        className="relative aspect-video overflow-hidden bg-neutral-950"
        onMouseEnter={() => {
          setPreviewActive(true);
          setPreviewLoaded(true);
        }}
        onMouseLeave={() => setPreviewActive(false)}
      >
        {previewLoaded && src ? (
          <div
            className={cn(
              "transition-opacity duration-300",
              previewActive ? "opacity-100" : "opacity-0",
            )}
          >
            <HlsPlayer
              src={src}
              controls={false}
              autoPlay
              muted
              loop
              className="!aspect-video !rounded-none"
            />
          </div>
        ) : null}

        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-br from-neutral-800 via-neutral-900 to-black p-3 transition-opacity duration-300",
            previewActive && src ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="flex items-start justify-between">
            <span className="rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-neutral-300 backdrop-blur-sm">
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

            {src ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                <Play className="size-4 fill-current" aria-hidden="true" />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400">
                <Film className="size-4" aria-hidden="true" />
              </span>
            )}
          </div>
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
        <p className="mt-auto text-[11px] text-text-400">
          Uploaded {formatDate(video.createdAt)}
        </p>
      </div>
    </Link>
  );
}