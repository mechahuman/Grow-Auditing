import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import { SignOutButton } from '../../components/SignOutButton'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Plus } from 'lucide-react'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="bg-page min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 card-glass border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/leads" className="flex items-center gap-3 group">
            <img
              src="/favicon.png"
              alt="GROW Logo"
              width={36}
              height={36}
              className="transition-transform group-hover:scale-105"
            />
            <span className="text-lg font-bold text-gradient-brand">GROW</span>
          </Link>

          {/* Right-side actions */}
          <div className="flex items-center gap-3">
            <Link href="/enrich" className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <Plus size={14} />
              <span className="hidden sm:inline">New Lead</span>
            </Link>
            <span className="text-xs px-3 hidden md:block" style={{ color: 'var(--text-secondary)' }}>
              {user.email}
            </span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
