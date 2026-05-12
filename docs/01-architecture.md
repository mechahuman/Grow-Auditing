# 01 — Architecture

## High-level system diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Employee's Browser                            │
│  ┌────────────┐    ┌─────────────┐    ┌────────────────────┐    │
│  │ Input Form │ -> │ Progress UI │ -> │ Review & Edit Page │    │
│  └────────────┘    └─────────────┘    └────────────────────┘    │
└──────────────┬─────────────────────────────────┬─────────────────┘
               │                                 │
               ▼                                 ▼
       POST /api/enrich                  POST /api/save
               │                                 │
               ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js API Routes (Vercel)                    │
│                                                                  │
│  ┌─────────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │ Enrichment      │  │ AI Analysis   │  │ Persistence      │   │
│  │ Orchestrator    │->│ (Claude API)  │->│ (Supabase +      │   │
│  │                 │  │               │  │  Google Sheets)  │   │
│  └─────────────────┘  └───────────────┘  └──────────────────┘   │
└──────┬──────────────────────┬───────────────────────┬───────────┘
       │                      │                       │
       ▼                      ▼                       ▼
┌─────────────┐       ┌──────────────┐       ┌──────────────────┐
│ YouTube API │       │ Claude API   │       │ Supabase (DB)    │
│ + About     │       │              │       │ + Google Sheets  │
│ page scrape │       │              │       │   (mirror)       │
└─────────────┘       └──────────────┘       └──────────────────┘
```

## Two-storage model

This system has two storage layers, on purpose:

| Layer | Purpose | Source of truth for |
|---|---|---|
| **Google Sheets** | Human-facing workflow | The team's day-to-day lead list |
| **Supabase Postgres** | System's internal store | Audit history, AI drafts, raw data, future ML features |

**On every save, the system writes to both.** The Google Sheet is what the team sees and edits. Supabase keeps the rich underlying data (full AI analysis JSON, raw YouTube API responses, timestamps, etc.) that doesn't fit cleanly into a spreadsheet.

If a sheet row is edited manually by an employee, that's fine — the Supabase record is treated as historical/snapshot. We do NOT sync sheet edits back to Supabase in v1. (This avoids two-way sync complexity. Re-evaluate in v2.)

## The enrichment pipeline (end-to-end)

When the employee submits the form, here's what happens server-side:

```
1. Validate input
   - YouTube URL is well-formed and resolves to a channel
   - G-Factor is 1–5
   - Found By is one of the allowed values

2. Fetch YouTube channel data (YouTube Data API)
   - channels.list endpoint: snippet, statistics, brandingSettings
   - Get: subscriber count, total views, video count, channel created date,
     description, thumbnail, custom URL, country

3. Fetch recent videos (YouTube Data API)
   - search.list to get last 10–15 videos
   - videos.list to get statistics for each
   - Compute: avg views (last 10), last upload date, posting frequency

4. Scrape About page (lightweight HTTP request, not headless browser)
   - Fetch https://www.youtube.com/@HANDLE/about
   - Parse for business email and external links

5. Compute scoring factors (deterministic, no AI)
   - YT Score Factor (always 1 in v1 since YT URL is required)
   - Sub Range Factor (tiered by subscriber count)
   - S2V Factor (binary: avg views ≥ 10% of subscriber count)
   - Total computed using rubric in 03-scoring-rubric.md

6. AI analysis (Claude API, single call)
   - Send structured input: channel summary + recent videos + bio
   - Receive structured JSON: category, content style, observations, draft remarks
   - See 05-ai-analysis.md for prompt and schema

7. Return assembled draft to client
   - Client renders the review page

8. On user confirm, persist to both Supabase and Google Sheets
```

Total expected time: 30–90 seconds. The slow steps are the YouTube video fetching (~5–15s) and the Claude API call (~10–30s).

## Why Next.js API routes (not FastAPI)

We considered Python/FastAPI + Celery + Redis. Rejected for v1 because:

- One language across frontend and backend reduces cognitive load and infra
- Vercel deploys Next.js for free with zero config; FastAPI needs Railway/Render
- The enrichment workload is I/O-bound (waiting on APIs), not CPU-bound; no need for Celery
- 60-second enrichment fits within Vercel's serverless function timeout (60s on free tier, 5min on Pro)

If a single enrichment ever exceeds 60s, switch to Vercel Pro or move that endpoint to a long-running background job. Don't over-engineer now.

## Why Supabase

- Free tier (500MB DB, 1GB storage, 50k monthly active users) covers the trial easily
- Built-in auth (email/password or magic link) for the team login
- Native pgvector support for the future memory layer
- Postgres-native; standard SQL, no lock-in

## Folder structure (recommended)

```
/lead-intel-system
  /app                      # Next.js App Router
    /api
      /enrich/route.ts      # POST /api/enrich
      /save/route.ts        # POST /api/save
      /leads/route.ts       # GET /api/leads (list)
    /(authenticated)
      /enrich/page.tsx      # Input form
      /review/[id]/page.tsx # Review & edit page
      /leads/page.tsx       # List of past leads
    /login/page.tsx
    /layout.tsx
  /lib
    /youtube                # YouTube API client + About page scraper
    /ai                     # Claude client + prompt builders
    /scoring                # Pure scoring functions
    /sheets                 # Google Sheets client
    /supabase               # Supabase client and types
  /docs                     # This folder, kept in repo
  /supabase
    /migrations             # SQL migrations
  package.json
  .env.local                # Not committed
  .env.example              # Committed template
```

## What "done" looks like for v1

A team member can:

1. Log in to the tool
2. Open the enrich form
3. Enter a YouTube URL, name, G-Factor, and "Found By"
4. Wait ~60 seconds
5. See a fully drafted lead row with all auto-fetched fields and AI-drafted remarks
6. Edit anything (especially the remarks)
7. Click save
8. See the row appear in the team's Google Sheet
9. See the row appear in the tool's internal list of past leads

That's v1. Nothing more.
