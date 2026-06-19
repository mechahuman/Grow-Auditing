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
      .select('id, lead_name, found_by, subscriber_count, lead_score_total, status, created_at, youtube_handle, channel_thumbnail_url')
      .eq('draft', false)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('team_members')
      .select('initials, full_name')
      .eq('active', true)
      .order('full_name'),
  ])

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-1">Saved Leads</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
