export const SHEET_TAB = 'Leads'

export const SHEET_COLUMNS = [
  'Date Added',
  'Lead Name',
  'Found By',
  'YouTube URL',
  'Handle',
  'Email',
  'Website',
  'Category',
  'Content Style',
  'Subscribers',
  'Avg Views (Last 10)',
  'S2V Ratio %',
  'Last Upload',
  'Monetization',
  'AI Remarks Draft',
  'Remarks (Final)',
  'YT Factor',
  'Sub Range Factor',
  'S2V Factor',
  'G-Factor',
  'Lead Score',
  'Status',
  'Status Notes',
  'Supabase ID',
]

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}
