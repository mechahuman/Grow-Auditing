import { notFound } from 'next/navigation'
import { createClient } from '../../../../../lib/supabase/server'
import { EditForm } from '../../../../../components/EditForm'

export default async function EditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [
    { data: lead, error: leadError },
    { data: teamMembers, error: teamError },
    { data: statusOptions, error: statusError },
  ] = await Promise.all([
    supabase.from('leads').select('*').eq('id', params.id).single(),
    supabase.from('team_members').select('initials, full_name').eq('active', true).order('full_name'),
    supabase.from('status_options').select('value, label, color').order('sort_order'),
  ])

  if (leadError || !lead || teamError || statusError) {
    notFound()
  }

  // Draft leads cannot be edited from the edit page (they use review page)
  if (lead.draft) {
    notFound()
  }

  return <EditForm lead={lead} teamMembers={teamMembers || []} statusOptions={statusOptions || []} />
}
