'use client'

import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  children,
  onClick,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#ff1493] to-[#9c27b0] text-white shadow-glow-pink hover:shadow-glow-pink-lg',
    secondary: 'bg-gradient-to-r from-[#ff8c00] to-[#ff6b6b] text-white shadow-glow-orange hover:shadow-glow-orange',
    tertiary: 'bg-gradient-to-r from-[#00d9ff] to-[#00e5cc] text-black',
    ghost: 'text-white hover:bg-[#2a2a4e]/50',
    outline: 'border border-[#2a2a4e] text-white hover:bg-[#2a2a4e]/30',
  }

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'transition-all duration-200 hover:scale-105'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  )
}
