'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    // Read persisted preference
    const stored = localStorage.getItem('theme')
    if (stored === 'light') {
      document.documentElement.classList.add('light')
      setIsLight(true)
    }
  }, [])

  function toggleTheme() {
    const next = !isLight
    setIsLight(next)
    if (next) {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="btn-ghost p-2 rounded-lg transition-all"
      title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {isLight ? (
        <Moon size={18} className="text-[var(--text-secondary)]" />
      ) : (
        <Sun size={18} className="text-[var(--text-secondary)]" />
      )}
    </button>
  )
}
