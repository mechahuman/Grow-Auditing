'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  gradient?: 'primary' | 'secondary' | 'tertiary' | 'none'
  glowing?: boolean
}

export function Card({
  children,
  className = '',
  gradient = 'none',
  glowing = false,
}: CardProps) {
  const gradientClasses = {
    primary: 'bg-gradient-to-br from-[#ff1493] to-[#9c27b0]',
    secondary: 'bg-gradient-to-br from-[#ff8c00] to-[#ff6b6b]',
    tertiary: 'bg-gradient-to-br from-[#00d9ff] to-[#00e5cc]',
    none: 'bg-[#16213e]/40 backdrop-blur-md border border-[#2a2a4e]',
  }

  const glowClass = glowing ? 'shadow-glow-pink' : ''

  return (
    <div
      className={`rounded-2xl backdrop-blur-md transition-all duration-300 ${
        gradientClasses[gradient]
      } ${glowClass} ${className}`}
    >
      {children}
    </div>
  )
}
