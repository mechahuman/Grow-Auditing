import { notFound } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import LeadDetail from '../../../../components/LeadDetail'

export default async function LeadPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [leadRes, statusRes] = await Promise.all([
    supabase.from('leads').select('*').eq('id', params.id).single(),
    supabase.from('status_options').select('value, label').order('sort_order')
  ])

  if (leadRes.error || !leadRes.data) {
    notFound()
  }

  const lead = leadRes.data
  const statusLabel = statusRes.data?.find((opt: any) => opt.value === lead.status)?.label || lead.status

  return <LeadDetail lead={lead} statusLabel={statusLabel} />
}
