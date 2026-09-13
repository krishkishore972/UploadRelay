"use client";

import { useUploadDialog } from "@/components/upload/upload-dialog-context";
import { VideoLibrary } from "./video-library";
import {
  useDashboardVideos,
  useLoadVideosOnMount,
} from "./use-dashboard-videos";

export function VideosPage() {
  const { videos, isCreator, isLoading, errorMessage, loadVideos } =
    useDashboardVideos();
  const { uploadVersion } = useUploadDialog();
  useLoadVideosOnMount(loadVideos, uploadVersion);

  return (
    <main className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          {isCreator ? "Creator Portal" : "Studio Portal"}
        </p>
        <h1 className="headline-display mt-2 text-3xl font-bold text-neutral-950 md:text-4xl">
          {isCreator ? "All videos" : "Videos"}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
          {isCreator
            ? "Every cut your editors have staged for this channel."
            : "Masters you uploaded. Open a cut to submit it for creator review."}
        </p>
      </section>

      <VideoLibrary
        title={isCreator ? "Library" : "Uploaded videos"}
        hint={
          isLoading
            ? "Loading your library…"
            : `${videos.length} video${videos.length === 1 ? "" : "s"}`
        }
        videos={videos}
        isLoading={isLoading}
        errorMessage={errorMessage}
        emptyTitle={isCreator ? "No videos yet" : "No videos uploaded yet"}
        emptyDescription={
          isCreator
            ? "Cuts appear here after an editor uploads and links to you."
            : "Upload your first master cut and it will appear here."
        }
        onRefresh={loadVideos}
        showUpload={!isCreator}
      />
    </main>
  );
}
