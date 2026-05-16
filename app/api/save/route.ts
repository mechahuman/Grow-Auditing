import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { computeLeadScore } from '../../../lib/scoring'
import { appendLeadRow } from '../../../lib/sheets'

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

  const { lead_id, g_factor, lead_name, found_by, email, website, instagram, twitter,
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
      instagram: instagram || null,
      twitter: twitter || null,
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

  // Write to Google Sheets (best-effort — Supabase is already saved)
  try {
    const rowRef = await appendLeadRow({
      id: lead_id,
      created_at: existing.created_at,
      lead_name,
      found_by,
      youtube_url: existing.youtube_url,
      youtube_handle: existing.youtube_handle,
      email: email || null,
      website: website || null,
      instagram: instagram || null,
      twitter: twitter || null,
      category,
      content_style,
      subscriber_count: existing.subscriber_count,
      avg_views_last_10: existing.avg_views_last_10,
      s2v_ratio_pct: existing.s2v_ratio_pct,
      last_upload_at: existing.last_upload_at,
      monetization,
      remarks_ai_draft: existing.remarks_ai_draft,
      remarks_final,
      yt_score_factor: existing.yt_score_factor,
      sub_range_factor: existing.sub_range_factor,
      s2v_factor: existing.s2v_factor,
      g_factor: gFactorNum,
      lead_score_total: score.leadScoreTotal,
      status,
      status_notes: status_notes || null,
    })

    if (rowRef) {
      await supabase
        .from('leads')
        .update({ sheets_synced: true, google_sheet_row_ref: rowRef })
        .eq('id', lead_id)
    }
  } catch (sheetsErr) {
    console.error('Google Sheets write failed (non-blocking):', sheetsErr)
    await supabase
      .from('leads')
      .update({
        sheets_sync_attempts: 1,
        sheets_sync_last_attempted_at: new Date().toISOString(),
      })
      .eq('id', lead_id)
  }

  return NextResponse.json({ success: true, leadId: lead_id })
}
