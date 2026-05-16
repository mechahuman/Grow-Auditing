'use client'

import { ReactNode } from 'react'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  gradient?: 'primary' | 'secondary' | 'tertiary' | 'none'
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  gradient = 'primary',
  className = '',
}: StatCardProps) {
  return (
    <Card gradient={gradient} className={`p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-white/70 font-medium">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        {icon && (
          <div className="text-3xl sm:text-4xl opacity-80">{icon}</div>
        )}
      </div>
    </Card>
  )
}
