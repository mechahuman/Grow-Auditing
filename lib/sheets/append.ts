import { getSheetsClient, getSpreadsheetId } from './client'
import { SHEET_TAB, formatDate } from './format'

export interface LeadForSheet {
  id: string
  created_at: string
  lead_name: string
  found_by: string
  youtube_url: string
  youtube_handle: string | null
  email: string | null
  website: string | null
  instagram: string | null
  twitter: string | null
  category: string | null
  content_style: string | null
  subscriber_count: number | null
  avg_views_last_10: number | null
  s2v_ratio_pct: number | null
  last_upload_at: string | null
  monetization: string | null
  remarks_ai_draft: string | null
  remarks_final: string | null
  yt_score_factor: number | null
  sub_range_factor: number | null
  s2v_factor: number | null
  g_factor: number
  lead_score_total: number | null
  status: string
  status_notes: string | null
}

export async function appendLeadRow(lead: LeadForSheet): Promise<string | null> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  const row = [
    formatDate(lead.created_at),
    lead.lead_name,
    lead.found_by,
    lead.youtube_url,
    lead.youtube_handle ?? '',
    lead.email ?? '',
    lead.website ?? '',
    lead.instagram ?? '',
    lead.twitter ?? '',
    lead.category ?? '',
    lead.content_style ?? '',
    lead.subscriber_count ?? '',
    lead.avg_views_last_10 ?? '',
    lead.s2v_ratio_pct ?? '',
    formatDate(lead.last_upload_at),
    lead.monetization ?? '',
    lead.remarks_ai_draft ?? '',
    lead.remarks_final ?? '',
    lead.yt_score_factor ?? '',
    lead.sub_range_factor ?? '',
    lead.s2v_factor ?? '',
    lead.g_factor,
    lead.lead_score_total ?? '',
    lead.status,
    lead.status_notes ?? '',
    lead.id,
  ]

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_TAB}!A:X`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  })

  const updatedRange = response.data.updates?.updatedRange ?? null
  if (updatedRange) {
    const match = updatedRange.match(/^(.+!A\d+)/)
    return match ? match[1] : updatedRange
  }
  return null
}
