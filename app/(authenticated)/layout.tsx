import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { NavbarWrapper } from '../../components/NavbarWrapper'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user's role from team_members table
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = teamMember?.role === 'admin'

  return (
    <div className="bg-page min-h-screen">
      <NavbarWrapper userEmail={user.email || ''} isAdmin={isAdmin} />

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
