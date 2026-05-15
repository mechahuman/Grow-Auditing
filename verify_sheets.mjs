import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// Get credentials from env
const credB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
const sheetId = process.env.GOOGLE_SHEET_ID

if (!credB64 || !sheetId) {
  console.error('Missing credentials')
  process.exit(1)
}

const credJson = Buffer.from(credB64, 'base64').toString('utf8')
const creds = JSON.parse(credJson)

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
})

const sheets = google.sheets({ version: 'v4', auth })

console.log('=== GOOGLE SHEETS VERIFICATION ===\n')

try {
  // Get spreadsheet metadata
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: sheetId
  })
  
  console.log(`Sheet: ${meta.data.properties.title}`)
  console.log(`Tabs:`)
  meta.data.sheets.forEach(s => {
    console.log(`  - ${s.properties.title} (${s.properties.gridProperties.rowCount} rows, ${s.properties.gridProperties.columnCount} cols)`)
  })
  
  // Read the Leads tab
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Leads!A1:X5'
  })
  
  console.log('\nLeads Tab (first 5 rows):')
  const rows = response.data.values || []
  rows.forEach((row, i) => {
    if (i === 0) {
      console.log(`  ROW ${i} (Headers): ${row.slice(0, 5).join(' | ')} ...`)
    } else {
      console.log(`  ROW ${i}: ${row[0] || '?'} | ${row[1] || '?'} | Score: ${row[20] || '?'}`)
    }
  })
  
  console.log('\n✓ Google Sheets integration confirmed!')
} catch (err) {
  console.error('Error:', err.message)
}
