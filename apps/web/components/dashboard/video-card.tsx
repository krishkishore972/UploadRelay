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
      className="smooth-transition group flex flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:border-neutral-300 hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06)]"
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
            "absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-br from-neutral-800 via-neutral-900 to-black p-4 transition-opacity duration-300",
            previewActive && src ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-neutral-300 backdrop-blur-sm">
              {fileExtension(video.originalFileName)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium",
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

          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] text-neutral-400">
                {formatDate(video.createdAt)}
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-neutral-200">
                {formatBytes(video.originalSize)}
              </p>
            </div>

            {src ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400">
                <Film className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-neutral-950">
            {video.title || video.originalFileName}
          </h3>
          <ArrowUpRight
            className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-950"
            aria-hidden="true"
          />
        </div>
        <p className="line-clamp-1 font-mono text-[11px] text-neutral-500">
          {video.originalFileName}
        </p>
        <p className="mt-auto pt-1 text-[11px] text-neutral-400">
          Uploaded {formatDate(video.createdAt)}
        </p>
      </div>
    </Link>
  );
}
