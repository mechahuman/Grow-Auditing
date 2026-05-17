'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'

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
    <div className="bg-page min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative gradient orbs */}
      <div
        className="pointer-events-none fixed top-[-10%] left-[10%] w-96 h-96 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(58, 12, 163, 0.6) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="pointer-events-none fixed bottom-[-10%] right-[5%] w-96 h-96 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(241, 91, 181, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Login card */}
      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Image
            src="/favicon.png"
            alt="GROW Logo"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-gradient-primary mb-2">GROW</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Lead Intelligence Platform</p>
        </div>

        {/* Glass card */}
        <div className="card-glass p-8">
          <h2 className="text-xl font-semibold mb-1">Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
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
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
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
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm border" style={{ background: 'rgba(255, 107, 107, 0.12)', borderColor: 'rgba(255, 107, 107, 0.3)', color: '#ff6b6b' }}>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full mt-6">
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
