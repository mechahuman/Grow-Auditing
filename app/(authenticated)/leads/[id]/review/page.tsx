import { notFound } from 'next/navigation'
import { createClient } from '../../../../../lib/supabase/server'
import { ReviewForm } from '../../../../../components/ReviewForm'

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [leadRes, membersRes, statusRes] = await Promise.all([
    supabase.from('leads').select('*').eq('id', params.id).single(),
    supabase.from('team_members').select('initials, full_name').eq('active', true).order('full_name'),
    supabase.from('status_options').select('value, label').order('sort_order'),
  ])

  if (leadRes.error || !leadRes.data) notFound()

  return (
    <ReviewForm
      lead={leadRes.data}
      teamMembers={membersRes.data ?? []}
      statusOptions={statusRes.data ?? []}
    />
  )
}
