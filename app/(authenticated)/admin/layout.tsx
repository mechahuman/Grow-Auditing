'use client'

import { useState } from 'react'
import { SignOutButton } from '../../../components/SignOutButton'
import { Home, Users, List, ArrowLeft, Copy, Download, Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'members', label: 'Team Members', icon: Users },
  { id: 'enrich', label: 'Enrich', icon: Sparkles },
  { id: 'leads', label: 'Lead Management', icon: List },
  { id: 'duplicates', label: 'Duplicates', icon: Copy },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'api', label: 'API Status', icon: Zap },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-page">
      {/* Sidebar - Hover Collapsible */}
      <div
        className="h-screen flex flex-col border-r flex-shrink-0 transition-all duration-300"
        style={{
          width: sidebarExpanded ? '256px' : '80px',
          borderColor: 'var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div
          className="flex-shrink-0 border-b flex items-center justify-center overflow-hidden"
          style={{
            borderColor: 'var(--border-subtle)',
            padding: sidebarExpanded ? '24px' : '8px',
            minHeight: '80px',
          }}
        >
          {sidebarExpanded ? (
            <img
              src="/logo-light.png"
              alt="GROW Logo"
              className="flex-shrink-0 max-h-12"
              style={{ maxWidth: '100%' }}
            />
          ) : (
            <img
              src="/apple-touch-icon.png"
              alt="GROW Logo"
              width={64}
              height={64}
              className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-hidden">
          {navItems.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/admin?section=${id}`}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200"
              style={{
                color: 'var(--text-secondary)',
                background: 'transparent',
                justifyContent: sidebarExpanded ? 'flex-start' : 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'
                e.currentTarget.style.color = '#a855f7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
              title={!sidebarExpanded ? label : ''}
            >
              <Icon size={20} className="flex-shrink-0" />
              {sidebarExpanded && <span className="truncate">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sign Out Button at Bottom */}
        <div className="flex-shrink-0 border-t p-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <SignOutButton hideText={!sidebarExpanded} />
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
