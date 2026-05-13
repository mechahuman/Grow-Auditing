import { google } from 'googleapis'

let _sheets: ReturnType<typeof google.sheets> | null = null

export function getSheetsClient() {
  if (_sheets) return _sheets

  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
  if (!b64) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not set')

  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  _sheets = google.sheets({ version: 'v4', auth })
  return _sheets
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID
  if (!id) throw new Error('GOOGLE_SHEET_ID is not set')
  return id
}
