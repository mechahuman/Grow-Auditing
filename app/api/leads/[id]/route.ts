import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { computeLeadScore } from '../../../../lib/scoring'
import { appendLeadRow, updateLeadRow, deleteLeadRow } from '../../../../lib/sheets'
import type { LeadForSheet } from '../../../../lib/sheets'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  return NextResponse.json({ lead })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { g_factor, lead_name, found_by, email, website, instagram, twitter,
    category, content_style, monetization, posting_pattern,
    remarks_final, status, status_notes } = body as Record<string, string>

  const gFactorNum = parseInt(g_factor, 10)
  if (isNaN(gFactorNum) || gFactorNum < 1 || gFactorNum > 5) {
    return NextResponse.json({ error: 'g_factor must be 1–5' }, { status: 400 })
  }

  // Fetch existing lead
  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Recompute score
  const score = computeLeadScore({
    hasYouTube: true,
    subscriberCount: existing.subscriber_count ?? 0,
    avgViewsLast10: existing.avg_views_last_10,
    gFactor: gFactorNum as 1 | 2 | 3 | 4 | 5,
  })

  // Update Supabase
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
    })
    .eq('id', params.id)

  if (updateError) {
    console.error('Supabase update error:', updateError)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }

  // Handle Google Sheets: if no row ref yet, append; otherwise update existing
  try {
    const leadForSheet: LeadForSheet = {
      id: existing.id,
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
    }

    if (!existing.google_sheet_row_ref) {
      // First edit: append to Sheets
      const rowRef = await appendLeadRow(leadForSheet)
      if (rowRef) {
        await supabase
          .from('leads')
          .update({ google_sheet_row_ref: rowRef, sheets_synced: true })
          .eq('id', params.id)
      }
    } else {
      // Subsequent edits: update existing row
      await updateLeadRow(existing.google_sheet_row_ref, leadForSheet)
    }
  } catch (sheetsErr) {
    console.error('Google Sheets operation failed (non-blocking):', sheetsErr)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  console.log(`[DELETE] Attempting to delete lead with ID: ${params.id}`)

  // Fetch lead to get google_sheet_row_ref
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('google_sheet_row_ref, id')
    .eq('id', params.id)
    .single()

  if (fetchError || !lead) {
    console.error(`[DELETE] Lead not found: ${params.id}`, fetchError)
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  console.log(`[DELETE] Found lead: ${JSON.stringify(lead)}`)

  // Delete from Google Sheets if row ref exists
  if (lead.google_sheet_row_ref) {
    try {
      console.log(`[DELETE] Deleting from Google Sheets: ${lead.google_sheet_row_ref}`)
      await deleteLeadRow(lead.google_sheet_row_ref)
    } catch (sheetsErr) {
      console.error('[DELETE] Google Sheets delete failed (non-blocking):', sheetsErr)
    }
  }

  // Delete from Supabase - PERMANENTLY
  console.log(`[DELETE] Executing database DELETE for: ${params.id}`)
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[DELETE] Supabase delete error:', error)
    return NextResponse.json({ error: 'Failed to delete lead', details: error }, { status: 500 })
  }

  console.log(`[DELETE] Successfully deleted lead: ${params.id}`)
  return NextResponse.json({ success: true, message: 'Lead permanently deleted' })
}
