import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, lead_name, found_by, subscriber_count, lead_score_total, status, created_at, youtube_handle, youtube_url, draft')
    .eq('draft', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }

  return NextResponse.json({ leads: leads ?? [] })
}
