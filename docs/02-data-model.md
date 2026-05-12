# 02 — Data Model

This file defines every field in the system, where it lives, who fills it, and where it comes from.

---

## Supabase schema

### Table: `leads`

The main record. One row per lead.

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Human input
  lead_name text not null,
  found_by text not null,                          -- team member who added the lead
  g_factor int not null check (g_factor between 1 and 5),

  -- Source URLs (YouTube required for v1)
  youtube_url text not null,
  youtube_handle text,                             -- parsed from URL, e.g. "RyanTolmia"
  youtube_channel_id text,                         -- canonical YT channel ID, e.g. "UC..."

  -- YouTube fetched data
  subscriber_count int,
  total_views bigint,
  video_count int,
  channel_created_at timestamptz,
  last_upload_at timestamptz,
  avg_views_last_10 int,
  s2v_ratio_pct numeric(6,2),                      -- (avg_views_last_10 / subscriber_count) * 100

  -- Scraped from About page (editable by employee)
  email text,
  website text,

  -- AI-classified (editable by employee)
  category text,
  content_style text,
  monetization text,                               -- aka "Product / Price"

  -- AI-generated draft (editable by employee)
  remarks_ai_draft text,
  remarks_final text,

  -- Scoring (computed, see 03-scoring-rubric.md)
  yt_score_factor numeric(3,2),
  sub_range_factor numeric(3,2),
  s2v_factor numeric(3,2),
  g_factor_normalized numeric(3,2),
  lead_score_total numeric(3,2),                   -- final score on 1–5 scale

  -- Workflow state
  status text default 'new',                       -- new, mail_sent, replied, call_booked, etc.
  status_notes text,                               -- free text from human after outreach

  -- Audit
  enriched_by text,                                -- email of user who triggered enrichment
  ai_confidence text,                              -- low / medium / high (from AI output)
  raw_youtube_data jsonb,                          -- full YouTube API responses, for debugging
  raw_ai_response jsonb,                           -- full Claude response, for debugging
  google_sheet_row_id text                         -- the row this corresponds to in Sheets
);

create index leads_status_idx on leads(status);
create index leads_created_at_idx on leads(created_at desc);
create index leads_youtube_channel_id_idx on leads(youtube_channel_id);
```

### Table: `team_members`

Manually populated. Used as the "Found By" dropdown.

```sql
create table team_members (
  id uuid primary key default gen_random_uuid(),
  initials text not null unique,                   -- e.g., "J", "O", "M"
  full_name text not null,
  email text,
  active boolean default true,
  created_at timestamptz default now()
);
```

> NOTE: The user said they'll populate this themselves in code initially. Create a seed file (`supabase/seed.sql`) with a few placeholder rows that the user can edit.

### Table: `status_options`

Optional but recommended — gives a dropdown of valid status values, editable without code changes.

```sql
create table status_options (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,                      -- e.g., "mail_sent"
  label text not null,                             -- e.g., "Mail sent"
  color text,                                      -- optional, for UI
  sort_order int default 0
);
```

Seed values:
- `new` → "New"
- `mail_sent` → "Mail sent"
- `followed_up` → "Followed up / Loom sent"
- `replied` → "Replied"
- `call_booked` → "Call booked"
- `closed_won` → "Closed — onboarded"
- `closed_lost` → "Closed — passed"

---

## Google Sheets columns

The Google Sheet is a near-mirror of the `leads` table, but flatter and human-friendly. One row per lead.

Sheet name: `Leads` (configurable via env var)

| # | Column | Source | Type | Notes |
|---|---|---|---|---|
| 1 | Date Added | System | Date | `created_at` formatted |
| 2 | Lead Name | Human | Text | |
| 3 | Found By | Human | Text | initials |
| 4 | YouTube URL | Human | URL | |
| 5 | YouTube Handle | System | Text | parsed |
| 6 | Email | System (editable) | Text | scraped, blank if not found |
| 7 | Website | System (editable) | URL | scraped, blank if not found |
| 8 | Category | System (editable) | Text | AI-classified |
| 9 | Content Style | System (editable) | Text | AI-classified |
| 10 | Subscriber Count | System | Number | |
| 11 | Avg Views (last 10) | System | Number | |
| 12 | S2V Ratio % | System | Number | 1 decimal place |
| 13 | Last Upload | System | Date | |
| 14 | Monetization | System (editable) | Text | aka Product / Price |
| 15 | Remarks (AI Draft) | System | Text | original AI text, kept for reference |
| 16 | Remarks (Final) | Human | Text | what the team actually uses |
| 17 | YT Factor | System | Number | 0 or 1 |
| 18 | Sub Range Factor | System | Number | 0 / 0.5 / 1 |
| 19 | S2V Factor | System | Number | 0 or 1 |
| 20 | G-Factor | Human | Number | 1–5 |
| 21 | Lead Score (Total) | System | Number | final 1–5 |
| 22 | Status | Human | Text | from dropdown |
| 23 | Status Notes | Human | Text | post-outreach context |
| 24 | Supabase ID | System | Text | hidden-ish, used for lookups |

> The Supabase ID column (24) is the link between the sheet row and the DB record. Keep it in column X or similar, far right. Don't hide it (sheets can break on hidden columns) but visually it's last.

### Sheet setup

The system expects:
- A spreadsheet with a tab named `Leads`
- Row 1 contains the column headers exactly as listed above
- The system appends new rows to this tab

A separate setup script (`scripts/init-sheet.ts`) should create the tab with headers if it doesn't exist. Document this in `06-google-sheets.md`.

---

## Field-by-field: who fills what, and when

| Field | Step in workflow | Who/what fills it |
|---|---|---|
| Lead Name | Input form | Employee |
| Found By | Input form (dropdown) | Employee |
| YouTube URL | Input form | Employee |
| G-Factor | Input form (1–5 dropdown) | Employee |
| YouTube Handle | Enrichment | Parsed from URL |
| YouTube Channel ID | Enrichment | YouTube API |
| Subscriber Count, Total Views, etc. | Enrichment | YouTube API |
| Last Upload, Avg Views | Enrichment | YouTube API + calculation |
| S2V Ratio % | Enrichment | Calculation |
| Email | Enrichment | About page scrape |
| Website | Enrichment | About page scrape OR YouTube `brandingSettings` |
| Category, Content Style, Monetization | Enrichment | AI (Claude) |
| Remarks (AI Draft) | Enrichment | AI (Claude) |
| Scoring factors | Enrichment | Pure calculation (see 03-scoring-rubric.md) |
| Lead Score Total | Enrichment | Pure calculation |
| Remarks (Final) | Review screen | Employee edits AI draft |
| Status, Status Notes | Later, after outreach | Employee |

---

## What to do when fields can't be filled

Different fields fail differently. Spec for each:

| Field | If unavailable |
|---|---|
| Email | Leave blank. Employee can fill in later. |
| Website | Leave blank. |
| Last Upload | Leave blank (very inactive channels). |
| Avg Views (last 10) | Use what's available (e.g., last 5). If fewer than 3 videos, leave blank and mark as `low_data`. |
| S2V Ratio | Cannot compute → leave blank, set S2V Factor to 0. |
| AI fields (category, etc.) | If AI returns invalid JSON, retry once. If still failing, save what was fetched and flag the lead as `enrichment_partial`. Show error on review screen so the human knows. |

---

## Versioning the schema

Use Supabase migrations from day one. Even for the first table, create a numbered migration file:

```
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_add_seed_status_options.sql
...
```

Never edit a past migration. Always add new ones for changes. This makes Claude Code's job easier later when modifying the schema.
