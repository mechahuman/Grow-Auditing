'use client'

interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  className?: string
  label?: string
  icon?: React.ReactNode
}

export function Input({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  className = '',
  label,
  icon,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white mb-2">{label}</label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0b0c0]">{icon}</div>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full rounded-lg bg-[#16213e]/60 backdrop-blur-md border border-[#2a2a4e] px-4 py-3 text-white placeholder-[#808090] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff1493]/50 focus:border-[#ff1493] ${
            icon ? 'pl-10' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />
      </div>
    </div>
  )
}
