'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

const HLS_URL = 'https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8'

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari: native HLS support
      video.src = HLS_URL
    } else if (Hls.isSupported()) {
      // Chrome/Firefox: use hls.js
      const hls = new Hls({ startLevel: -1 })
      hls.loadSource(HLS_URL)
      hls.attachMedia(video)
      return () => hls.destroy()
    }
  }, [])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
}
