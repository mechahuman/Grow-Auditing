import { getSheetsClient, getSpreadsheetId } from './client'
import { SHEET_TAB } from './format'

export async function deleteLeadRow(rowRef: string): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  // Extract row number from "Leads!A3" format
  const rowMatch = rowRef.match(/!A(\d+)$/)
  if (!rowMatch) throw new Error(`Invalid row reference format: ${rowRef}`)
  const rowNumber = parseInt(rowMatch[1], 10)

  // Get spreadsheet metadata to find the sheet ID for "Leads" tab
  const metadata = await sheets.spreadsheets.get({ spreadsheetId })
  const leadsSheet = metadata.data.sheets?.find(
    (s) => s.properties?.title === SHEET_TAB
  )

  if (!leadsSheet?.properties?.sheetId) {
    throw new Error(`Sheet "${SHEET_TAB}" not found`)
  }

  const sheetId = leadsSheet.properties.sheetId

  // Delete the row using batchUpdate with deleteDimension
  // Note: 0-indexed for row numbers in requests (row 1 = index 0)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1, // Convert 1-indexed to 0-indexed
              endIndex: rowNumber, // deleteRange is half-open [start, end)
            },
          },
        },
      ],
    },
  })
}
