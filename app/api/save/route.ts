import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { computeLeadScore } from '../../../lib/scoring'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { lead_id, g_factor, lead_name, found_by, email, website,
    category, content_style, monetization, posting_pattern,
    remarks_final, status, status_notes } = body as Record<string, string>

  if (!lead_id) return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })

  const gFactorNum = parseInt(g_factor, 10)
  if (isNaN(gFactorNum) || gFactorNum < 1 || gFactorNum > 5) {
    return NextResponse.json({ error: 'g_factor must be 1–5' }, { status: 400 })
  }

  // Fetch current lead to get fixed factors
  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('subscriber_count, avg_views_last_10, yt_score_factor, sub_range_factor, s2v_factor, created_at, youtube_url, youtube_handle, remarks_ai_draft, s2v_ratio_pct, last_upload_at, total_views, video_count')
    .eq('id', lead_id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const score = computeLeadScore({
    hasYouTube: true,
    subscriberCount: existing.subscriber_count ?? 0,
    avgViewsLast10: existing.avg_views_last_10,
    gFactor: gFactorNum as 1 | 2 | 3 | 4 | 5,
  })

  const { error: updateError } = await supabase
    .from('leads')
    .update({
      lead_name,
      found_by,
      g_factor: gFactorNum,
      email: email || null,
      website: website || null,
      category,
      content_style,
      monetization,
      posting_pattern,
      remarks_final,
      status,
      status_notes: status_notes || null,
      g_factor_normalized: score.gFactorNormalized,
      lead_score_total: score.leadScoreTotal,
      draft: false,
    })
    .eq('id', lead_id)

  if (updateError) {
    console.error('Supabase update error:', updateError)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }

  return NextResponse.json({ success: true, leadId: lead_id })
}
