'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/leads')
      router.refresh()
    }
  }

  return (
    <div className="page-bg min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #1A5A63 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-15 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #6EB498 0%, transparent 70%)', animationDelay: '2s' }}
      />

      {/* Login card */}
      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #A4F4C9 0%, #6EB498 100%)' }}>
            <TrendingUp size={28} color="#0D3B66" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-1">GROW</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Lead Intelligence Platform</p>
        </div>

        {/* Glass card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm"
                   style={{ background: 'rgba(255, 107, 107, 0.12)', border: '1px solid rgba(255, 107, 107, 0.3)', color: 'var(--error)' }}>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Internal tool — authorized users only
        </p>
      </div>
    </div>
  )
}
