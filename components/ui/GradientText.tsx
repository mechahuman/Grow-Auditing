'use client'

import { ReactNode } from 'react'

interface GradientTextProps {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p'
  gradient?: 'primary' | 'secondary' | 'tertiary'
  className?: string
}

export function GradientText({
  children,
  as: Component = 'h2',
  gradient = 'primary',
  className = '',
}: GradientTextProps) {
  const gradientClasses = {
    primary: 'bg-gradient-to-r from-[#ff1493] to-[#9c27b0] bg-clip-text text-transparent',
    secondary: 'bg-gradient-to-r from-[#ff8c00] to-[#ff6b6b] bg-clip-text text-transparent',
    tertiary: 'bg-gradient-to-r from-[#00d9ff] to-[#00e5cc] bg-clip-text text-transparent',
  }

  return (
    <Component className={`${gradientClasses[gradient]} font-bold ${className}`}>
      {children}
    </Component>
  )
}
