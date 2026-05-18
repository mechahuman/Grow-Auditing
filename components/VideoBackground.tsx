'use client'

export function VideoBackground() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src="/video/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}
