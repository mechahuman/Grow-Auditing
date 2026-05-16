'use client'

import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'pink' | 'purple' | 'orange' | 'cyan' | 'teal' | 'neutral'
  className?: string
}

export function Badge({ children, variant = 'pink', className = '' }: BadgeProps) {
  const variantClasses = {
    pink: 'bg-[#ff1493]/20 text-[#ff1493] border border-[#ff1493]/50',
    purple: 'bg-[#9c27b0]/20 text-[#9c27b0] border border-[#9c27b0]/50',
    orange: 'bg-[#ff8c00]/20 text-[#ff8c00] border border-[#ff8c00]/50',
    cyan: 'bg-[#00d9ff]/20 text-[#00d9ff] border border-[#00d9ff]/50',
    teal: 'bg-[#00e5cc]/20 text-[#00e5cc] border border-[#00e5cc]/50',
    neutral: 'bg-[#2a2a4e] text-[#b0b0c0] border border-[#2a2a4e]',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
