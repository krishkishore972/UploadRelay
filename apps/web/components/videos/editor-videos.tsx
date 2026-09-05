"use client";

import { useEffect, useState } from "react";

import { goApi } from "@/lib/go-api";
import { HlsPlayer } from "./hls-player";

type EditorVideo = {
  id: string;
  title: string | null;
  originalFileName: string;
  originalS3Key: string;
  originalMimeType: string | null;
  originalSize: number | null;
  previewPrefix: string | null;
  masterPlaylistKey: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type GetEditorVideosResponse = {
  videos: EditorVideo[];
};

function playlistUrl(masterPlaylistKey: string) {
  const baseUrl = process.env.NEXT_PUBLIC_S3_PREVIEW_BASE_URL;

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl.replace(/\/$/, "")}/${masterPlaylistKey}`;
}

export function EditorVideos() {
  const [videos, setVideos] = useState<EditorVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadVideos() {
      try {
        setErrorMessage("");

        const response = await goApi.get<GetEditorVideosResponse>(
          "/videos/editor",
        );

        setVideos(response.data.videos);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load videos.");
      } finally {
        setIsLoading(false);
      }
    }

    loadVideos();
  }, []);

  if (isLoading) {
    return <p className="text-sm text-text-800">Loading videos...</p>;
  }

  if (errorMessage) {
    return (
      <p className="rounded-md border border-accent-700/30 bg-accent-700/10 px-3 py-2 text-sm text-accent-900">
        {errorMessage}
      </p>
    );
  }

  if (videos.length === 0) {
    return <p className="text-sm text-text-800">No videos uploaded yet.</p>;
  }

  return (
    <div className="grid gap-4">
      {videos.map((video) => {
        const src = video.masterPlaylistKey
          ? playlistUrl(video.masterPlaylistKey)
          : "";

        return (
          <article
            key={video.id}
            className="rounded-lg border border-background-200 bg-background-100 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-text-950">
                  {video.title || video.originalFileName}
                </h2>
                <p className="mt-1 text-sm text-text-800">
                  {video.originalFileName}
                </p>
              </div>

              <span className="rounded-md bg-background-200 px-2 py-1 text-xs font-medium text-text-900">
                {video.status}
              </span>
            </div>

            <div className="mt-4">
              {src ? (
                <HlsPlayer src={src} />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-md bg-background-200 text-sm text-text-800">
                  Preview not ready yet
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}