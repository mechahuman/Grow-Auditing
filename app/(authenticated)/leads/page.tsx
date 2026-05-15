import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { LeadsTable } from '../../../components/LeadsTable'

export default async function LeadsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: leads },
    { data: teamMembers },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id, lead_name, found_by, subscriber_count, lead_score_total, status, created_at, youtube_handle')
      .eq('draft', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('team_members')
      .select('initials, full_name')
      .eq('active', true)
      .order('full_name'),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{(leads ?? []).length} saved leads</p>
        </div>
        <Link
          href="/enrich"
          className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + New Lead
        </Link>
      </div>

      <LeadsTable leads={leads ?? []} teamMembers={teamMembers ?? []} currentUserEmail={user?.email ?? ''} />
    </div>
  )
}
