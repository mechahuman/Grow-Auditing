import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import { SignOutButton } from '../../components/SignOutButton'
import { ThemeToggle } from '../../components/ThemeToggle'
import { TrendingUp, Plus } from 'lucide-react'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="page-bg min-h-screen">
      {/* Top Navigation Bar */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(13, 59, 102, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/leads" className="flex items-center gap-2.5 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #A4F4C9 0%, #6EB498 100%)' }}
            >
              <TrendingUp size={14} color="#0D3B66" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-gradient">GROW Lead Intel</span>
          </Link>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/enrich"
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={14} />
              New Lead
            </Link>
            <span
              className="text-xs px-2 hidden sm:block"
              style={{ color: 'var(--text-muted)' }}
            >
              {user.email}
            </span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
