import { notFound } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import { LeadView } from '../../../../components/LeadView'

export default async function LeadPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [
    { data: lead, error: leadError },
    { data: statusOptions, error: statusError },
  ] = await Promise.all([
    supabase.from('leads').select('*').eq('id', params.id).single(),
    supabase.from('status_options').select('value, label, color').order('sort_order'),
  ])

  if (leadError || !lead || statusError) {
    notFound()
  }

  // Map status value to label
  const statusLabel =
    statusOptions?.find((opt) => opt.value === lead.status)?.label || lead.status

  return <LeadView lead={lead} statusLabel={statusLabel} />
}
