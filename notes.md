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

## 2026-05-13 — Week 2 engineering: YouTube pipeline + vitest

**What we did:**
- Built the full `lib/youtube/` module (8 files):
  - `types.ts` — shared interfaces (ParsedYouTubeUrl, ChannelData, VideoData, AboutData, YouTubeEnrichmentResult)
  - `parseUrl.ts` — URL parser handling @handle, /channel/UC…, /c/ and /user/ legacy formats
  - `client.ts` — thin fetch wrapper with retry-once, quota/key error classification (YouTubeApiError with httpStatus)
  - `channels.ts` — fetchChannelByHandle, fetchChannelById, resolveChannelFromLegacy (logs 100-unit warning)
  - `videos.ts` — fetchRecentVideoIds (playlistItems.list, 1 unit) + fetchVideoStats (videos.list, 1 unit)
  - `aboutScraper.ts` — fetches /@handle/about, extracts ytInitialData via brace-counter (resilient to nested braces), finds businessEmail + external links recursively; always fails gracefully
  - `orchestrator.ts` — fetchAllYouTubeData() wires steps 1–8; computes avgViewsLast10, s2vRatioPct, lastUploadAt, postingFrequency30d (videos in last 30 days)
  - `index.ts` — public API re-exports
- Installed vitest + created `vitest.config.ts` (globals: true for Jest-style test syntax)
- All 6 scoring unit tests now pass: `npm test`
- Created `scripts/fetch-youtube.ts` — full pipeline CLI: fetch → compute score → insert draft lead in Supabase
- Updated package.json: added `test`, `test:watch` scripts; added `--env-file=.env.local` to all script commands

**Week 2 milestone hit:**
`npm run fetch-youtube -- https://www.youtube.com/@RyanTolmia` completed successfully:
- Channel: Ryan Tolmia, 464 subs, 103 videos, last upload 2026-05-08
- Engagement: avg 194 views/video, S2V ratio 41.8%, 4 posts last 30 days
- Website scraped: https://adhd-creator-toolkit.carrd.co/ (no email — normal, often auth-gated)
- Score: 3.5 "Solid fit" (sub range 0 because <1k; S2V factor 1 because 41.8% >> 10%)
- Saved to Supabase as draft lead: ID 6715900b-1517-422a-9664-dca557158ce1

**What worked:**
- brace-counter extraction of ytInitialData is much more reliable than greedy regex
- playlistItems.list approach confirmed: 3 API calls total (channel + playlist + videoStats = 3 quota units)
- Graceful scraper failure: pipeline completes even if About page returns nothing

**What didn't / things to watch:**
- About page scraper successfully parsed ytInitialData and found the website link but no email — this is expected for channels without a public business email, not a bug
- `vitest.config.ts` needed `globals: true` because the test file uses `test()`/`expect()` without explicit imports
- Legacy /c/ and /user/ URL formats cost 100 quota units (search.list) — warn is logged, still works

**What's next (Week 3):**
- Design AI provider abstraction (`lib/ai/`) before writing any AI code
  - Groq: OpenAI-compatible, use JSON mode (response_format: { type: 'json_object' })
  - Anthropic: tool_use approach for structured output
  - Both behind `AI_PROVIDER` env var switch
- Confirm Groq model: llama-3.3-70b-versatile (already in .env.local)
- Build `lib/ai/analyze.ts` — takes YouTubeEnrichmentResult, returns AI fields
- Wire AI output into the pipeline (orchestrator or separate step)
- Pre-condition: Manav must complete `docs/calibration-baseline.md` before Week 3 prompt engineering

---

## 2026-05-13 — Sub Range Factor tiers updated

**Decision:** Changed Sub Range Factor thresholds.

Old tiers: 0–999 → 0 | 1k–9.9k → 0.5 | 10k+ → 1
New tiers: 0–999 → 0 | 1k–4,999 → 0.5 | 5k+ → 1 (no upper cap)

**Why:** Company's typical client range tops out near 10k, making the old 10k+ threshold too high to be useful. 5k+ as the full-score threshold better reflects the actual target client profile. No upper cap — channels above 10k also score full points.

**Files updated:** `docs/03-scoring-rubric.md`, `PROJECT_EXPLAINER.md`
**Code impact (when building):** Update `SUB_RANGE_TIERS` constants in `lib/scoring/config.ts`.

---

## 2026-05-13 — Week 3 engineering: AI analysis layer

**What we did:**
- Built the full `lib/ai/` module (6 files):
  - `types.ts` — ChannelAnalysis, AnalysisResult interfaces
  - `systemPrompt.ts` — static system prompt constant (neutral tone, JSON schema embedded, strict rules)
  - `promptBuilder.ts` — buildUserPrompt() converts YouTubeEnrichmentResult to text prompt (computes channelAgeMonths, lastUploadDaysAgo, formats video list, handles nulls)
  - `client.ts` — callAI() with AI_PROVIDER abstraction (groq implemented, anthropic throws useful error). Lazy-initializes Groq client. Uses `response_format: { type: 'json_object' }` for guaranteed JSON output.
  - `analyzer.ts` — analyzeChannel() orchestrates prompt → AI call → JSON parse → validation → AnalysisResult. Retries once on network error, once on invalid JSON. Returns enrichment_partial=true on full failure.
  - `index.ts` — public API re-exports
- Added `scripts/analyze-youtube.ts` CLI: fetch YouTube data + run AI analysis + print structured result
- Added `analyze-youtube` script to package.json

**Week 3 milestone hit:**
Ran `npm run analyze-youtube` against two calibration leads:
- Tom's AI Insights (28 subs, 11-day-old channel): correctly returned ai_confidence=low, category="AI insights creator", no monetization visible, data gaps flagged correctly
- JZ Helps Florida law firm (16k subs, 1.7% S2V): correctly returned ai_confidence=medium, surfaced low S2V as a concern, monetization="Legal services"

**What worked:**
- Groq JSON mode (`response_format: { type: 'json_object' }`) returns valid JSON reliably
- Embedding the schema in the system prompt + JSON mode = clean structured output without Anthropic tool_use
- ai_confidence=low correctly triggered for the 11-day-old channel with sparse data
- Provider abstraction is clean — swapping AI_PROVIDER=anthropic is the only change needed later

**What didn't / things to watch:**
- Top-level await in the CLI script caused esbuild error — wrapped in async main() to match fetch-youtube.ts pattern
- Calibration loop (comparing AI output to human remarks) is deferred — no human remarks in calibration-baseline.md yet. Team will fill these in and we'll run a prompt iteration pass then.
- G-Factor is a human input on the review screen (Week 4), not an AI output — confirmed clean separation.

---

## 2026-05-13 — Week 4 engineering: UI + API routes + Google Sheets

**What we did:**
- middleware.ts — auth guard redirecting unauthenticated users to /login, logged-in users away from /login
- lib/sheets/ (5 files): format.ts (SHEET_TAB, SHEET_COLUMNS, formatDate), client.ts (getSheetsClient, lazy singleton), append.ts (appendLeadRow), init.ts (initSheet), index.ts
- API routes: /api/enrich (POST: YouTube + AI + Supabase insert), /api/save (POST: score recompute + Supabase update + Sheets append), /api/leads (GET: list non-draft leads), /api/leads/[id] (GET + DELETE)
- UI pages: /login (email/password), /(authenticated)/layout (auth guard + navbar), /leads (list), /enrich (form), /enrich/progress (simulated status messages + fetch to /api/enrich), /leads/[id]/review (review + edit)
- Components: SignOutButton.tsx, LeadsTable.tsx (filters + search), ReviewForm.tsx (live score update on G-Factor change, score breakdown, AI observations, editable fields, discard modal, remarks with AI draft toggle)
- scripts/init-sheet.ts — wraps initSheet()
- app/page.tsx — root redirect to /leads
- tsconfig.json — exclude *.test.ts to prevent vitest globals from breaking tsc

**Build verified:**
- `npx tsc --noEmit` → clean
- `npm run build` → clean, all 11 routes compile
- `npm run init-sheet` → created "Leads" tab, 24 columns, row 1 frozen + bolded

**Key decisions made in build:**
- G-Factor live score: computed client-side in ReviewForm via simple formula (no API call). Score updates instantly as employee adjusts G-Factor 1–5.
- Sheets write is best-effort: /api/save always saves to Supabase first, then tries Sheets. If Sheets fails, sets sheets_sync_attempts=1 for the cron retry. User never sees a failure for a Sheets hiccup.
- Recent videos stored in raw_youtube_data JSONB ({ recentVideos, channel }) — ReviewForm extracts and displays top 5.
- Progress page uses sessionStorage to pass form data from the enrich form — avoids URL length limits.
- Discard: requires confirmation modal, only deletes draft leads.

**What's next (Week 5):**
- Error handling: YouTube quota, channel-not-found, Sheets auth failure — all need user-facing messages
- Loading states everywhere
- Toast notifications (already built in ReviewForm, needs to propagate to other pages)
- Score breakdown modal ("What is this?") — already built in ReviewForm
- Discard confirmation already built
- Structured logging on API routes
- README with setup/deploy instructions

---
