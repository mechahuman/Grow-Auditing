'use client'

import { ReactNode } from 'react'

interface PremiumLayoutProps {
  children: ReactNode
  className?: string
  showGlobe?: boolean
}

export function PremiumLayout({
  children,
  className = '',
  showGlobe = true,
}: PremiumLayoutProps) {
  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base dark background */}
        <div className="absolute inset-0 bg-[#0f0f23]" />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-[#1a1a2e] via-[#0f0f23] to-[#0f0f23]" />

        {/* Animated gradient orbs */}
        {showGlobe && (
          <>
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-[#ff1493]/20 to-[#9c27b0]/10 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br from-[#ff8c00]/15 to-[#ff6b6b]/10 rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-gradient-to-br from-[#00d9ff]/10 to-[#00e5cc]/5 rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '4s' }} />
          </>
        )}
      </div>

      {/* Content */}
      <div className={`relative z-10 ${className}`}>{children}</div>
    </div>
  )
}
