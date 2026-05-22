'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { VideoBackground } from '../../components/VideoBackground'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleGoogleLogin() {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to initiate Google login')
      setLoading(false)
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      // Check user role to determine redirect destination
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      const isAdmin = teamMember?.role === 'admin'
      setIsLeaving(true)
      setTimeout(() => {
        router.push(isAdmin ? '/admin' : '/leads')
        router.refresh()
      }, 400)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left panel — Video background only (hidden on mobile) */}
      <div
        className="hidden lg:block lg:w-[55%] bg-black overflow-hidden"
        style={{
          position: 'relative',
          height: '100vh',
          width: '55%',
        }}
      >
        <VideoBackground />
      </div>

      {/* Right panel — Login form */}
      <div
        className="flex-1 lg:w-[45%] bg-page flex items-center justify-center p-8 relative overflow-hidden"
        style={{
          opacity: isLeaving ? 0 : 1,
          transition: 'opacity 0.4s ease-in',
        }}
      >
        {/* Decorative gradient orbs for form panel */}
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

        <div className="relative w-full max-w-md">
          {/* GROW Logo / Brand */}
          <div className="text-center mb-8">
            <img
              src="/favicon.png"
              alt="GROW Logo"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-gradient-primary mb-2">GROW</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Lead Intelligence Platform
            </p>
          </div>

          {/* Glass card */}
          <div className="card-glass p-8">
            <h2 className="text-xl font-semibold mb-1">Welcome back</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Sign in to access your dashboard
            </p>

            {!showAdminLogin ? (
              <div className="space-y-4">
                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg font-medium transition-all border flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {error && (
                  <div
                    className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm border"
                    style={{
                      background: 'rgba(255, 107, 107, 0.12)',
                      borderColor: 'rgba(255, 107, 107, 0.3)',
                      color: '#ff6b6b',
                    }}
                  >
                    <span>{error}</span>
                  </div>
                )}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: 'var(--border-subtle)' }}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                      Or
                    </span>
                  </div>
                </div>

                {/* Toggle to admin login */}
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                  }}
                >
                  Admin login
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* Email field */}
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="growadmin@gmail.com"
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
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

                {/* Error message */}
                {error && (
                  <div
                    className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm border"
                    style={{
                      background: 'rgba(255, 107, 107, 0.12)',
                      borderColor: 'rgba(255, 107, 107, 0.3)',
                      color: '#ff6b6b',
                    }}
                  >
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-6"
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

                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLogin(false)
                    setEmail('')
                    setPassword('')
                    setError(null)
                  }}
                  className="w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors mt-4"
                  style={{
                    color: 'var(--text-secondary)',
                  }}
                >
                  Back to Google login
                </button>
              </form>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Internal tool — authorized users only
          </p>
        </div>
      </div>
    </div>
  )
}
