# 06 — Google Sheets Integration

The Google Sheet is the team's primary view of the lead database. The system writes to it on every save.

---

## Setup (one-time)

### Step 1: Create a Google Cloud project

If you already have one for YouTube API, reuse it. Otherwise create a new project.

### Step 2: Enable the Google Sheets API

In the Google Cloud Console:
- APIs & Services → Library → search "Google Sheets API" → Enable

### Step 3: Create a service account

- IAM & Admin → Service Accounts → Create
- Name: `lead-intel-sheets-writer`
- Skip role assignment (we'll grant access on the sheet directly)
- Create
- On the service account's page, Keys → Add Key → JSON → download

The downloaded JSON file contains the service account's credentials. Store as `GOOGLE_SERVICE_ACCOUNT_JSON` in env (base64-encode it for cleaner storage, decode at runtime).

### Step 4: Create the Google Sheet

In Google Drive:
- New → Google Sheet → name it (e.g., "Lead Intel — Master")
- Open the sheet's URL, copy the spreadsheet ID from it. Format: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
- Store the ID as `GOOGLE_SHEET_ID` in env

### Step 5: Share the sheet with the service account

- In the sheet, click Share
- Paste the service account's email (found in the JSON, looks like `lead-intel-sheets-writer@PROJECT.iam.gserviceaccount.com`)
- Give "Editor" access
- Uncheck "Notify people"
- Send

The service account can now read and write the sheet.

### Step 6: Initialize the sheet structure

Run a one-time setup script: `scripts/init-sheet.ts`

This script:
- Checks if a tab named `Leads` exists
- If not, creates it
- Writes the column headers in row 1 (see `02-data-model.md` for the exact list)
- Freezes row 1
- Sets data validation:
  - "Found By" column → list of valid team member initials
  - "Status" column → list of valid statuses
  - "G-Factor" column → numbers 1–5
- Sets number formatting on numeric columns

Run with: `npm run init-sheet`

---

## How writes work

### On save (POST /api/save)

The handler:

1. Inserts a row into Supabase `leads` table (returns the `id`)
2. Calls Google Sheets API to append a row to the `Leads` tab
3. Updates the Supabase record with the sheet row's A1 reference (e.g., `Leads!A57`) so we can find it later
4. Returns success to the client

### Library

Use the official `googleapis` npm package:

```bash
npm install googleapis
```

### Authentication

```typescript
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64!, 'base64').toString()
  ),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
```

### Append a row

```typescript
await sheets.spreadsheets.values.append({
  spreadsheetId: process.env.GOOGLE_SHEET_ID!,
  range: 'Leads!A:X',
  valueInputOption: 'USER_ENTERED', // lets Sheets interpret dates, URLs correctly
  insertDataOption: 'INSERT_ROWS',
  requestBody: {
    values: [[
      formatDate(lead.created_at),
      lead.lead_name,
      lead.found_by,
      lead.youtube_url,
      lead.youtube_handle,
      lead.email || '',
      lead.website || '',
      lead.category || '',
      lead.content_style || '',
      lead.subscriber_count,
      lead.avg_views_last_10,
      lead.s2v_ratio_pct,
      formatDate(lead.last_upload_at),
      lead.monetization || '',
      lead.remarks_ai_draft,
      lead.remarks_final,
      lead.yt_score_factor,
      lead.sub_range_factor,
      lead.s2v_factor,
      lead.g_factor,
      lead.lead_score_total,
      lead.status,
      lead.status_notes || '',
      lead.id, // Supabase ID, last column
    ]],
  },
});
```

---

## What about updates?

In v1, the Sheet receives a single append on save. We do **not** sync subsequent edits (in either direction).

If the employee edits the sheet directly (e.g., changes status), that's reflected in the sheet only. Supabase doesn't know.

If the employee re-opens the lead in the tool and edits there, the tool updates Supabase. We do NOT push the update back to the sheet in v1 (to avoid two-way sync complexity).

This is a deliberate simplification. Document it clearly so the team knows: **the sheet is for tracking and reporting; the tool is for enrichment.**

Re-evaluate in v2 based on team feedback.

---

## Error handling

| Situation | Behavior |
|---|---|
| Service account auth fails | 500 error, log secrets are misconfigured |
| Sheet doesn't exist or wrong ID | 500 error, surface clearly to user |
| Sheet tab `Leads` missing | Auto-create on first write (degrade gracefully) |
| Append fails mid-save | Supabase write already succeeded → return success to user, queue a retry for the sheet append |
| Quota exceeded (very unlikely at our scale) | Retry with exponential backoff |

The user must never see a save fail just because Sheets had a hiccup. Supabase is the source of truth; the sheet is a mirror.

---

## Implementation structure

```
/lib/sheets/
  client.ts          # Auth + initialized sheets client
  init.ts            # Sets up headers, validation, formatting
  append.ts          # appendLeadRow()
  format.ts          # Date and number formatters
  index.ts
```

---

## Testing

For local development:
- Create a separate "test" Google Sheet
- Share with the same service account
- Use a `.env.test` with the test sheet ID
- Append a few test rows, manually verify they look right

For CI (later, optional):
- Mock the `googleapis` calls so tests don't hit the real API

---

## Open question

The user (Manav) mentioned the team might want Airtable-style structure but starting with Google Sheets is fine. If after a few months they ask to switch to Airtable:

- The Supabase data is portable; export to Airtable easily
- The integration layer is isolated in `/lib/sheets/`, swap with `/lib/airtable/`
- Don't pre-optimize for this now

---

## Important: data integrity

Because the sheet is a flattened copy of Supabase, never treat it as authoritative for any system logic. All scoring, querying, history, etc., uses Supabase. The sheet is read-only from the system's perspective (we only ever append).
