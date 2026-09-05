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

    
}
