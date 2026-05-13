import { getSheetsClient, getSpreadsheetId } from './client'
import { SHEET_TAB, SHEET_COLUMNS } from './format'

export async function initSheet(): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const existing = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === SHEET_TAB
  )

  let sheetId: number

  if (!existing) {
    const addResp = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_TAB } } }],
      },
    })
    sheetId = addResp.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0
    console.log(`Created "${SHEET_TAB}" tab`)
  } else {
    sheetId = existing.properties?.sheetId ?? 0
    console.log(`"${SHEET_TAB}" tab already exists (sheetId: ${sheetId})`)
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [SHEET_COLUMNS] },
  })

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: 'userEnteredFormat.textFormat.bold',
          },
        },
      ],
    },
  })

  console.log(`Done — ${SHEET_COLUMNS.length} columns written, row 1 frozen and bolded`)
}
