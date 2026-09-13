"use client";

import { useCallback, useEffect, useState } from "react";

import { goApi } from "@/lib/go-api";
import {
  type CreatorVideo,
  type EditorVideo,
  type GetCreatorVideosResponse,
  type GetEditorVideosResponse,
} from "@/lib/dashboard/types";

export type DashboardVideo = EditorVideo | CreatorVideo;

export function useDashboardVideos() {
  const [videos, setVideos] = useState<DashboardVideo[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  return { videos, isCreator, isLoading, errorMessage, loadVideos };
}

export function useLoadVideosOnMount(
  loadVideos: () => Promise<void>,
  extraKey?: number,
) {
  useEffect(() => {
    loadVideos();
  }, [loadVideos, extraKey]);
}
