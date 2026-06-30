'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, Shield } from 'lucide-react'
import { SignOutButton } from './SignOutButton'

export function NavbarWrapper({ userEmail, isAdmin }: { userEmail: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  // Don't render navbar on admin pages
  if (isAdminPage) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 card-glass border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/leads" className="flex items-center gap-3 group">
          <img
            src="/logo-light.png"
            alt="GROW Logo"
            width={80}
            height={80}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Right-side actions */}
        <div className="flex items-center gap-3">
          <Link href="/enrich" className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
            <Plus size={14} />
            <span className="hidden sm:inline">New Lead</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs px-4 py-2 flex items-center gap-1.5 rounded-lg border transition-colors hover:bg-opacity-50"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Shield size={14} />
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
          )}
          <span className="text-xs px-3 hidden md:block" style={{ color: 'var(--text-secondary)' }}>
            {userEmail}
          </span>
          <SignOutButton />
        </div>
      </div>
    </nav>
  )
}
