// Quick smoke test: verify Google Sheets service account can read the target sheet.
// Run with: npx tsx scripts/test-sheets.ts

import { google } from 'googleapis'

const B64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
const SHEET_ID = process.env.GOOGLE_SHEET_ID
if (!B64) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_B64 not set')
if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID not set')

async function testSheets() {
  console.log('Testing Google Sheets API...\n')

  const credentials = JSON.parse(Buffer.from(B64!, 'base64').toString('utf-8'))
  console.log('Service account email:', credentials.client_email)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  console.log('Sheet title:         ', res.data.properties?.title)
  console.log('Sheet ID:            ', SHEET_ID)
  console.log('Tabs found:          ', res.data.sheets?.map(s => s.properties?.title).join(', '))
  console.log('\nGoogle Sheets API: OK')
}

testSheets().catch(err => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
