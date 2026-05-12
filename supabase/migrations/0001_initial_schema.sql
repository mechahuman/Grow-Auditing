-- 0001_initial_schema.sql
-- Full initial schema. Never edit this file — add new migrations for changes.

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Human input (from enrich form)
  lead_name text not null,
  found_by text not null,
  g_factor int not null check (g_factor between 1 and 5),

  -- YouTube source
  youtube_url text not null,
  youtube_handle text,
  youtube_channel_id text,

  -- YouTube fetched data
  subscriber_count int,
  total_views bigint,
  video_count int,
  channel_created_at timestamptz,
  last_upload_at timestamptz,
  avg_views_last_10 int,
  s2v_ratio_pct numeric(6,2),
  posting_frequency_30d numeric(5,2),     -- videos per month over last 30 days

  -- Scraped from About page (editable by employee)
  email text,
  website text,

  -- AI-classified (editable by employee)
  category text,
  content_style text,
  posting_pattern text,                   -- AI string e.g. "Weekly, consistent"
  monetization text,

  -- AI-generated (editable via remarks_final; originals kept for audit)
  strengths text[],
  concerns text[],
  data_gaps text[],
  remarks_ai_draft text,
  remarks_final text,

  -- Scoring (computed deterministically)
  yt_score_factor numeric(3,2),
  sub_range_factor numeric(3,2),
  s2v_factor numeric(3,2),
  g_factor_normalized numeric(3,2),
  lead_score_total numeric(3,2),

  -- AI metadata
  ai_confidence text check (ai_confidence in ('low', 'medium', 'high')),

  -- Workflow state
  status text not null default 'new',
  status_notes text,

  -- Draft flag: true until employee confirms save on review screen
  draft boolean not null default true,

  -- Google Sheets sync state
  sheets_synced boolean not null default false,
  sheets_sync_attempts int not null default 0,
  sheets_sync_last_attempted_at timestamptz,
  google_sheet_row_ref text,              -- A1 notation e.g. "Leads!A57"

  -- Audit
  enriched_by text,                       -- email of user who triggered enrichment
  raw_youtube_data jsonb,                 -- full YouTube API responses for debugging
  raw_ai_response jsonb                   -- full AI response for debugging
);

-- Filtered list query: always excludes drafts, ordered by recency
create index leads_created_at_draft_idx on leads (created_at desc, draft);

-- Status filter
create index leads_status_idx on leads (status);

-- Dedup check: avoid enriching the same channel twice
create index leads_youtube_channel_id_idx on leads (youtube_channel_id);

-- Cron query: find rows that failed to sync to Sheets
-- WHERE sheets_synced = false AND sheets_sync_attempts < 3 AND created_at > now() - interval '7 days'
create index leads_sheets_sync_idx on leads (sheets_synced, sheets_sync_attempts, created_at);


create table team_members (
  id uuid primary key default gen_random_uuid(),
  initials text not null unique,
  full_name text not null,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);


create table status_options (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,
  label text not null,
  color text,
  sort_order int not null default 0
);


-- Auto-update updated_at on leads
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row
  execute function update_updated_at();
