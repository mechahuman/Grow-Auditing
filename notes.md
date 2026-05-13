# Project Notes — Lead Intelligence & Contextual Scouting System

Working log. Append a dated entry after every meaningful work session.
Format: what we did → what worked → what didn't → what's next.

---

## 2026-05-12 — Spec read-through and Phase 2 consolidated review

**What we did:**
Read all 11 spec files in order (`docs/README.md` through `docs/10-open-decisions.md`). After each file, surfaced flags, ambiguities, and open decisions. Compiled a consolidated review covering contradictions, missing pieces, technical concerns, and a pre-Week 1 checklist. Manav answered every open question. Phase 2 and Phase 3 completed.

**Key decisions locked in this session:**
- Auth: email/password only (Supabase `signInWithPassword`). No magic link code anywhere.
- Storage: `google_sheet_row_ref text` stores A1 reference. `sheets_synced boolean` + `sheets_sync_attempts int` + `sheets_sync_last_attempted_at timestamptz` for cron retry. Cron stops after 3 attempts.
- AI provider: Groq (free tier) for the trial, with a provider abstraction (`AI_PROVIDER` env var). Anthropic remains an option. Groq model TBD before Week 3.
- YouTube: `playlistItems.list` (1 unit) for recent videos, not `search.list` (100 units). `posting_frequency_30d` computed over 30 days, stored as a dedicated column.
- New DB columns confirmed: `draft`, `sheets_synced`, `sheets_sync_attempts`, `sheets_sync_last_attempted_at`, `google_sheet_row_ref`, `posting_frequency_30d`, `posting_pattern`, `strengths text[]`, `concerns text[]`, `data_gaps text[]`.
- Two UI routes distinguished: `/leads/[id]/review` (post-enrichment confirmation, Save/Discard) vs `/leads/[id]` (read-only view with inline Edit toggle).
- Migration plan: `0001_initial_schema.sql` (full schema), `0002_seed_status_options.sql`, `0003_rls_policies.sql`.
- `ANTHROPIC_MODEL` = `claude-sonnet-4-6`. Never hardcode model string in code.
- Scoring formula: `1 + raw_total` with plain comment. All thresholds in `lib/scoring/config.ts`.
- Sheet columns derived dynamically from an ordered array — no hardcoded `A:X` range strings.
- `init-sheet.ts` reads `team_members` from Supabase at runtime for data validation.
- End-of-Week-2 hard milestone: one real YouTube URL through full pipeline via CLI. Week 3 does not start until this is demonstrated.
- pgvector / memory layer: hard block until Week 6 is complete. Refuse and redirect if asked earlier.

**What worked:**
- Reading docs one at a time and surfacing questions per file caught several contradictions before any code was written (magic link references, `search.list` vs `playlistItems.list`, field naming, formula presentation).
- Collecting all `// OPEN` items and presenting them in a single consolidated review was cleaner than asking mid-read.

**What didn't / things to watch:**
- Groq provider abstraction is new scope not in the original spec. Need to design the abstraction and confirm Groq model selection before Week 3. Groq's API is OpenAI-compatible — structured output enforcement works differently than Anthropic's tool_use.
- About page scraping is the highest-risk technical element. Build extremely defensively; blank fields are always preferable to errors.
- Vercel 60-second timeout is tight on the slow path. Monitor during Week 4 testing.

**What's next:**
- Manav completes pre-Week 1 checklist (Supabase, Google Cloud, Groq, Vercel setup, API keys).
- Manav gives explicit go-ahead to start Week 1 engineering.
- Week 1 engineering: Next.js init, Supabase schema migration, API key smoke tests, Vercel hello-world deploy.
- Week 1 non-engineering (in parallel): Manav manually scores 15 leads → writes `docs/calibration-baseline.md`.

---

## 2026-05-13 — Week 1 engineering: scaffold, env setup, API smoke tests

**What we did:**
- Initialized Next.js 14.2.35 manually (create-next-app failed due to capital letters in directory name — built config files by hand instead)
- Upgraded from 14.2.29 (security vulnerability) to 14.2.35 (patched)
- Created .env.local with all credentials: Supabase, YouTube API, Google Sheets service account, Groq
- Created full folder structure: app/, lib/scoring, lib/supabase, lib/ai, lib/youtube, lib/sheets, lib/scoring, supabase/migrations/, scripts/
- Wrote three Supabase migration files: 0001 (full schema with all confirmed fields), 0002 (status options seed), 0003 (RLS policies — apply in Week 5)
- Implemented lib/scoring/ module completely: config.ts (thresholds), factors.ts (pure functions), total.ts (formula), index.ts (public API)
- Wrote unit tests in total.test.ts using both spec worked examples as source of truth
- Created lib/supabase/client.ts, server.ts, service.ts
- Created smoke test scripts for all three APIs — all passed:
  - YouTube: fetched Ryan Tolmia (464 subs, 103 videos) ✓
  - Google Sheets: authenticated, sheet "GROW Lead Intel — Master" found ✓
  - Groq: llama-3.3-70b-versatile responded correctly ✓
- Git initialized, first commit: 42 files

**What worked:**
- All three APIs verified on first successful run
- Base64 service account issue resolved: PowerShell Out-File produces UTF-16, stripped whitespace to get clean base64
- next.config.ts → next.config.mjs: Next.js 14 doesn't support TypeScript config files

**What didn't / things to watch:**
- Google Sheet currently has tab named "Sheet1" not "Leads" — init-sheet.ts will need to create/rename the tab when we build it
- Scoring unit tests are written but can't run yet (no test runner installed — vitest/jest not in package.json). Add vitest in Week 2 when we build lib/youtube and need proper test infrastructure.
- CRON_SECRET in .env.local is currently empty — generate a random string before deploying to Vercel

**What's next:**
- Manav: push this repo to GitHub, connect to Vercel, deploy the hello-world, confirm it shows in browser
- Manav: fill in real team member names/initials in supabase/seed.sql
- Manav: run the Supabase migrations (npx supabase db push OR paste SQL in Supabase dashboard)
- Manav: begin manually scoring 15 leads → calibration-baseline.md
- When Manav gives the go-ahead: start Week 2 (YouTube pipeline)

---

## 2026-05-13 — Sub Range Factor tiers updated

**Decision:** Changed Sub Range Factor thresholds.

Old tiers: 0–999 → 0 | 1k–9.9k → 0.5 | 10k+ → 1
New tiers: 0–999 → 0 | 1k–4,999 → 0.5 | 5k+ → 1 (no upper cap)

**Why:** Company's typical client range tops out near 10k, making the old 10k+ threshold too high to be useful. 5k+ as the full-score threshold better reflects the actual target client profile. No upper cap — channels above 10k also score full points.

**Files updated:** `docs/03-scoring-rubric.md`, `PROJECT_EXPLAINER.md`
**Code impact (when building):** Update `SUB_RANGE_TIERS` constants in `lib/scoring/config.ts`.

---
