"use client"

import Hls from "hls.js"
import { useEffect, useRef } from "react"


type HlsPlayerProps = {
    src : string
}

export function HlsPlayer({src}: HlsPlayerProps) {

    const videoRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video || ! src) {
            return;
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            return;
        }

        if (!Hls.isSupported()) {
            return;
        }

        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video)
        return() => {
            hls.destroy();
        };
    },[src]);

    return (
        <video 
        ref={videoRef}
        className="aspect-video w-full rounded-md bg-black"
        controls
        playsInline
        />
    )
}