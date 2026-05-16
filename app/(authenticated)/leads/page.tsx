import { createClient } from '../../../lib/supabase/server'
import { LeadsTable } from '../../../components/LeadsTable'
import { LayoutList } from 'lucide-react'

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
      {/* Page header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutList size={18} style={{ color: 'var(--text-secondary)' }} />
            <h1 className="text-2xl font-bold text-gradient">Saved Leads</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {(leads ?? []).length} leads in your pipeline
          </p>
        </div>
      </div>

      <LeadsTable
        leads={leads ?? []}
        teamMembers={teamMembers ?? []}
        currentUserEmail={user?.email ?? ''}
      />
    </div>
  )
}
