'use client'

import { useState } from 'react'
import Image from 'next/image'

interface AvatarProps {
  thumbnailUrl: string | null
  initials: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ thumbnailUrl, initials, name, size = 'md' }: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const showImage = thumbnailUrl && !imageError

  if (showImage) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0`}>
        <Image
          src={thumbnailUrl}
          alt={name}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0 font-bold`}
      style={{ background: 'linear-gradient(135deg, rgba(164,244,201,0.2), rgba(110,180,152,0.2))', border: '1px solid rgba(164,244,201,0.3)', color: '#A4F4C9' }}>
      {initials}
    </div>
  )
}
