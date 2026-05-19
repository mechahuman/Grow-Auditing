'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div
        className="pointer-events-none absolute top-[-10%] left-[10%] w-96 h-96 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(58, 12, 163, 0.6) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[5%] w-96 h-96 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(241, 91, 181, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/favicon.png"
            alt="GROW Logo"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-gradient-primary mb-2">GROW</h1>
        </div>

        {/* Glass card */}
        <div className="card-glass p-8">
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your email has not been whitelisted by an administrator. Please contact your team lead to request access.
          </p>

          <div
            className="flex items-start gap-2 px-3 py-3 rounded-lg text-sm mb-6 border"
            style={{
              background: 'rgba(241, 91, 181, 0.12)',
              borderColor: 'rgba(241, 91, 181, 0.3)',
              color: '#f15bb5',
            }}
          >
            <span>
              Only whitelisted team members can access this application. Once your administrator adds your email to the whitelist, you'll be able to log in.
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Internal tool — authorized users only
        </p>
      </div>
    </div>
  )
}
