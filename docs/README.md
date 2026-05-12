# Lead Intelligence & Contextual Scouting System

> **Internal tool for a Digital Marketing Company that helps creators build their businesses.**
> This system automates the first pass of lead research for the company's outbound/scouting workflow.

---

## What this system does, in one paragraph

An employee finds a YouTube creator who might be a good client. Instead of spending 30+ minutes manually researching the creator, they enter the YouTube URL (plus a few other fields) into this tool. The system fetches all public YouTube data, scrapes the channel's About page for email and links, runs an AI analysis to draft observations about the creator's content and business, computes a lead score from a defined rubric, and writes the result to a Google Sheet. The employee reviews and edits before saving. Total enrichment time: ~60 seconds.

---

## The guiding philosophy

This is not a decision-making tool. It is a **research helper** that surfaces a structured draft for a human to review and edit. Every output is editable. The AI never makes the final call.

> The AI does the research. A human makes the call. That order never changes.

---

## What's in scope for v1

- YouTube-only data fetching and analysis (Instagram comes later)
- Google Sheets as the canonical storage layer
- Supabase Postgres as the system's internal mirror
- Web form for employee input
- AI-drafted observations (neutral tone, easy to edit)
- Computed lead score using the company's rubric
- Review-and-edit step before save

## What's deliberately NOT in scope for v1

- Instagram, TikTok, LinkedIn, or other platforms
- OAuth-based deep analytics (Meta Graph API, etc.)
- PDF report generation
- Memory layer with pgvector (deferred to buffer weeks if time allows)
- Automated outreach
- Multi-criteria-set support (different niches scored differently)
- Public-facing dashboard for leads

---

## How to navigate this spec

This `/docs` folder is structured so each file is self-contained for a specific aspect of the build. Read in this order:

1. **[`README.md`](./README.md)** — you are here
2. **[`01-architecture.md`](./01-architecture.md)** — system architecture, tech stack, data flow
3. **[`02-data-model.md`](./02-data-model.md)** — Supabase schema, Google Sheet columns, field-by-field definitions
4. **[`03-scoring-rubric.md`](./03-scoring-rubric.md)** — the lead scoring formula and the math
5. **[`04-youtube-pipeline.md`](./04-youtube-pipeline.md)** — what data we fetch from YouTube and how
6. **[`05-ai-analysis.md`](./05-ai-analysis.md)** — the AI prompt, expected output, calibration approach
7. **[`06-google-sheets.md`](./06-google-sheets.md)** — Google Sheets integration details
8. **[`07-ui-spec.md`](./07-ui-spec.md)** — the three screens the employee sees
9. **[`08-build-phases.md`](./08-build-phases.md)** — week-by-week build plan
10. **[`09-environment-and-secrets.md`](./09-environment-and-secrets.md)** — env vars, API keys, setup steps
11. **[`10-open-decisions.md`](./10-open-decisions.md)** — things still TBD, with recommendations

---

## Tech stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Single-language stack, deploys free on Vercel |
| Backend | Next.js API routes | Same codebase, no separate service to host |
| Database | Supabase (Postgres) | Free tier, easy auth, pgvector available when needed |
| Spreadsheet | Google Sheets API | Team's existing workflow |
| YouTube data | YouTube Data API v3 | Free, 10,000 units/day |
| AI | Anthropic Claude API | Best for nuanced analytical writing |
| Hosting | Vercel (free tier) | Zero-config for Next.js |
| Auth | Supabase Auth (magic link or email/password) | Comes with Supabase |

**Estimated monthly cost during trial: under ₹2,000**, mostly Claude API usage.

---

## How to read the rest of this spec as Claude Code

When working on a phase, open the relevant file(s) first. Don't read everything upfront — each file is scoped to a slice of work. For example, when building the YouTube pipeline, read `01-architecture.md`, `04-youtube-pipeline.md`, and `02-data-model.md`. Skip the rest.

Any field marked `// OPEN` is a decision the user (Manav) hasn't finalized — ask before assuming.
