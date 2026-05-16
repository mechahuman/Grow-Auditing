'use client'

import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      title="Sign out"
      className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-1.5"
    >
      <LogOut size={14} />
      Sign out
    </button>
  )
}
