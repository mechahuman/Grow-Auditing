# 10 — Open Decisions and Assumptions

Things that aren't 100% locked. Each has a recommended default so the build isn't blocked, but Manav can change any of these before code is written.

---

## Decisions deferred to Manav

### 1. Subscriber tier thresholds (`03-scoring-rubric.md`)

**Current:**
- 0–999: 0 points
- 1k–9.9k: 0.5 points
- 10k+: 1 point

**Status:** Locked for v1. Manav noted they may change later — kept as constants in `lib/scoring/config.ts` for easy tuning.

---

### 2. Score-to-label thresholds (`03-scoring-rubric.md`)

**Current:**
- 4.0–5.0 → Strong fit (green)
- 3.0–3.9 → Solid fit (blue)
- 2.0–2.9 → Weak fit (yellow)
- 1.0–1.9 → Poor fit (red)

**Status:** Recommended defaults. Adjust after seeing real scores from first 20 enrichments.

---

### 3. Team members list (`02-data-model.md`)

**Decision:** Manav will populate the `team_members` table manually in code initially. Seed file gets placeholder rows.

**Action item for Manav:** before deploy, add real team members to `supabase/seed.sql`.

---

### 4. Status options (`02-data-model.md`)

**Recommended starter list:**
- new
- mail_sent
- followed_up
- replied
- call_booked
- closed_won
- closed_lost

**Status:** Defaults from Manav's existing sheet. Confirm before deploy.

---

### 5. Tone of AI remarks (`05-ai-analysis.md`)

**Locked:** Neutral/professional tone, employee adds personality when editing. AI can lean slightly fun but never slangy.

---

### 6. Sheet structure (`06-google-sheets.md`)

**Decision:** Strict column order per `02-data-model.md`. The `init-sheet.ts` script creates exactly this structure. If Manav's existing sheet has a different order, decide:
- (a) Migrate the existing sheet to match the spec, or
- (b) Update the spec to match the existing sheet

Either is fine; pick before building the integration.

---

### 7. Memory layer (pgvector)

**Decision:** Skipped in v1. Implemented in buffer weeks if time allows.

If implemented, embedding choice:
- **OpenAI `text-embedding-3-small`** — cheap, 1536 dim, well-supported
- **Voyage AI** — slightly better quality, similar pricing

Default: OpenAI for simplicity (one fewer vendor account).

---

### 8. Authentication method

**Recommended:** Supabase magic link (email-only, no password to manage).

**Alternative:** email + password.

**Decision:** Magic link unless Manav prefers passwords.

---

### 9. AI vendor / model

**Locked:** Anthropic Claude. Use `claude-sonnet-4-5` or current strong model at build time.

**Why not GPT or Gemini:**
- Claude is best at nuanced analytical writing — fits this use case
- One vendor for everything (simpler)

If costs become a concern at scale, consider routing simpler classification tasks (category, content style) to a cheaper model and reserving Sonnet for the remarks draft. Don't optimize this prematurely.

---

## Assumptions made in the spec

These weren't explicitly discussed but were assumed sensible. Flag any that are wrong.

### A. Single Google Sheet for all leads

The spec assumes one master sheet with one tab named `Leads`. If the team wants separate sheets per quarter, per campaign, etc., the design changes slightly — add a `target_sheet` parameter to the save endpoint.

### B. All employees can see all leads

No row-level permissions on who can view which lead. This is fine for a small internal team. Add RLS policies in v2 if the team grows.

### C. No multi-tenancy

This is a single-company tool, not a SaaS. No "organization" concept needed.

### D. English-only

The AI prompt is in English. Channel descriptions in other languages will still work (Claude is multilingual) but the prompt itself doesn't switch language. Fine for v1.

### E. Vercel hosting

The spec assumes Vercel. If Manav wants self-hosting or a different platform (Railway, Render, Fly.io), the Next.js codebase moves anywhere, but env var management differs. Pick before deploy.

### F. No re-enrichment

Once a lead is saved, the YouTube data is frozen. We don't refresh it later. If a creator's subscriber count changes 3 months later, the saved lead still shows the old number. This is fine because the score reflects "at time of evaluation." If re-enrichment is wanted, that's a v2 feature.

### G. Manual scoring of past leads not migrated

The existing 7 leads in Manav's sheet are reference examples for calibration, not data to import into the new system. v1 starts with an empty database. If Manav wants to import the existing 50 leads, that's a separate migration script — out of scope for v1.

---

## Questions to revisit after 20 real enrichments

These won't be answerable until the tool runs in production. Capture data, decide later:

- Is the AI's category classification accurate enough?
- Is the remarks draft useful as-is, or rewritten by employees most of the time?
- Are the score thresholds (Strong/Solid/Weak/Poor) calibrated correctly?
- Is 60 seconds per enrichment acceptable?
- Should Instagram be added next, or Twitter/LinkedIn?
- Does the team still use the Google Sheet, or do they prefer the in-app list?

Set a checkpoint at "20 enrichments completed" to review these.

---

## v2 candidate features (don't build now, capture here)

For future planning. Do not build in v1.

- Instagram support (handle, follower count, recent post analysis)
- Re-enrichment (refresh YouTube data on demand)
- Bulk enrichment (queue 20 URLs at once)
- Memory layer with pgvector similarity search
- Outreach integration (when an employee marks status as "mail_sent," prefill an email template)
- Analytics dashboard (which factors correlate with successful clients?)
- Multi-criteria sets (different rubrics for different creator niches)
- PDF export of the lead report
- Two-way sync with Google Sheets (edits in sheet flow back to DB)
- Slack integration (notify channel when a 4.5+ lead is added)
- Webhook for "new lead enriched" events
- Public-facing "lead capture" form (creator submits their own info)
- Vision API on thumbnails (assess thumbnail quality)
- Transcript analysis for hooks
- Engagement quality scoring (top comments analyzed for authenticity)
