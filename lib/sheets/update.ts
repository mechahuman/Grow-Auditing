import { getSheetsClient, getSpreadsheetId } from './client'
import { SHEET_TAB, formatDate } from './format'
import type { LeadForSheet } from './append'

export async function updateLeadRow(rowRef: string, lead: LeadForSheet): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  // Extract row number from "Leads!A3" format
  const rowMatch = rowRef.match(/!A(\d+)$/)
  if (!rowMatch) throw new Error(`Invalid row reference format: ${rowRef}`)
  const rowNumber = rowMatch[1]

  const row = [
    formatDate(lead.created_at),
    lead.lead_name,
    lead.found_by,
    lead.youtube_url,
    lead.youtube_handle ?? '',
    lead.email ?? '',
    lead.website ?? '',
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

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_TAB}!A${rowNumber}:X${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}
