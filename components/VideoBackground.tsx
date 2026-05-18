'use client'

export function VideoBackground() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
      }}
    >
      <source src="/video/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}
