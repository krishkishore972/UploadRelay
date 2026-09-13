"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { VideoLibrary } from "./video-library";
import {
  useDashboardVideos,
  useLoadVideosOnMount,
} from "./use-dashboard-videos";

export function ReviewQueuePage() {
  const router = useRouter();
  const { videos, isCreator, isLoading, errorMessage, loadVideos } =
    useDashboardVideos();
  useLoadVideosOnMount(loadVideos);

  useEffect(() => {
    if (!isLoading && !isCreator) {
      router.replace("/dashboard/videos");
    }
  }, [isCreator, isLoading, router]);

  const queue = videos.filter(
    (video) => video.status === "APPROVAL_REQUESTED",
  );

  return (
    <main className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          Creator Portal
        </p>
        <h1 className="headline-display mt-2 text-3xl font-bold text-neutral-950 md:text-4xl">
          Review queue
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
          Preview-ready cuts waiting for your approve or request-changes action.
        </p>
      </section>

      <VideoLibrary
        title="Needs your decision"
        hint={
          isLoading
            ? "Loading review queue…"
            : `${queue.length} awaiting approval`
        }
        videos={queue}
        isLoading={isLoading}
        errorMessage={errorMessage}
        emptyTitle="Nothing to review"
        emptyDescription="When an editor submits a preview, it will show up here."
        onRefresh={loadVideos}
      />
    </main>
  );
}
