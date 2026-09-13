"use client";

import Link from "next/link";
import { ArrowUpRight, Film } from "lucide-react";

import type { CreatorVideo, EditorVideo } from "@/lib/dashboard/types";
import {
  fileExtension,
  formatBytes,
  formatDate,
} from "@/lib/dashboard/format";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";

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
  const from = counterpart(video);

  return (
    <Link href={`/dashboard/videos/${video.id}`} className="group block">
      <Card className="h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative flex aspect-video flex-col justify-between bg-gradient-to-br from-neutral-800 via-neutral-900 to-black p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-neutral-300">
              {fileExtension(video.originalFileName)}
            </span>
            <StatusBadge status={video.status} />
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

        <CardContent className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-sm font-semibold text-neutral-950">
              {video.title || video.originalFileName}
            </h3>
            <ArrowUpRight
              className="mt-0.5 size-4 shrink-0 text-neutral-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-accent"
              aria-hidden="true"
            />
          </div>
          <p className="line-clamp-1 text-xs text-neutral-600">
            {video.originalFileName}
          </p>
          {from ? (
            <p className="line-clamp-1 text-[11px] text-neutral-500">
              From {from}
            </p>
          ) : null}
          <p className="mt-auto pt-1 text-[11px] text-neutral-400">
            Uploaded {formatDate(video.createdAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
