"use client"

import Hls from "hls.js"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type HlsPlayerProps = {
  src: string
  className?: string
  controls?: boolean
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  poster?: string
}

export function HlsPlayer({
  src,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  poster,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) {
      return
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src
      return
    }

    if (!Hls.isSupported()) {
      return
    }

    const hls = new Hls()
    hls.loadSource(src)
    hls.attachMedia(video)

    return () => {
      hls.destroy()
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      className={cn("aspect-video w-full rounded-lg bg-black", className)}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      poster={poster}
    />
  )
}