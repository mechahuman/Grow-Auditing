'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full" style={{ background: 'rgba(255, 107, 107, 0.1)' }}>
            <AlertTriangle size={48} style={{ color: '#ff6b6b' }} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          Your account has not been registered as a team member. Please contact your administrator to request access.
        </p>

        {/* Email Info */}
        <div
          className="p-4 rounded-lg mb-6"
          style={{
            background: 'rgba(255, 107, 107, 0.08)',
            border: '1px solid rgba(255, 107, 107, 0.2)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            If you believe this is an error, please share the email associated with your Google account with your admin.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all"
          style={{
            background: 'rgba(168, 85, 247, 0.1)',
            color: '#a855f7',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'
          }}
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>
      </div>
    </div>
  )
}
