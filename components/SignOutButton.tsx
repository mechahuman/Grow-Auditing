'use client'

import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function SignOutButton({ hideText }: { hideText?: boolean } = {}) {
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
      className="btn-ghost flex items-center gap-2 text-sm px-4 py-2 justify-center font-medium"
    >
      <LogOut size={22} />
      {!hideText && <span>Sign out</span>}
    </button>
  )
}
