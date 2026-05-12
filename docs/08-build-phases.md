# 08 — Build Phases

Six weeks of build + two buffer weeks. Each week has a single primary goal. Don't try to parallelize across phases — finish one before starting the next.

---

## Week 1: Foundations + calibration

**Primary goal:** Have a working dev environment and a clear understanding of what makes a "good lead" by hand.

### Engineering tasks
- Init Next.js 14 project with App Router and Tailwind
- Set up Supabase project, run the initial schema migration (see `02-data-model.md`)
- Set up Google Cloud project, enable YouTube Data API v3 and Google Sheets API, get API keys
- Create the service account for Sheets, share a test sheet with it
- Set up local `.env.local` with all keys (see `09-environment-and-secrets.md`)
- Test that you can call the YouTube API and Sheets API independently with simple test scripts
- Deploy a "hello world" to Vercel to confirm hosting works

### Non-engineering tasks (do these in parallel)
- Manually score 15 YouTube creators yourself using the rubric (see `03-scoring-rubric.md`)
- For each, write your own draft "remarks" the way you'd write them in the sheet
- Write up a one-page reflection: what makes a good lead? What signals did you find yourself using?
- Save this as `docs/calibration-baseline.md` — this is your reference for evaluating the AI later

### Definition of done
- Vercel deploy is live, Supabase is set up, all keys work
- You have 15 manually-scored leads with handwritten remarks
- You have a clear, written description of what good looks like

### Common pitfalls
- Spending the week setting up tooling and skipping the manual scoring exercise. The manual scoring is the most important deliverable of the week.
- Trying to make the dev environment perfect before writing any actual code. Good enough is good enough.

---

## Week 2: YouTube data pipeline

**Primary goal:** Given a YouTube URL, fetch and structure all the data we need.

### Tasks
- Implement `/lib/youtube/parseUrl.ts` — supports all the URL formats listed in `04-youtube-pipeline.md`
- Implement `channels.ts`, `videos.ts` — call the YouTube API and parse responses
- Implement `aboutScraper.ts` — scrape email and links from the About page
- Implement `orchestrator.ts` — the end-to-end `fetchAllYouTubeData(url)` function
- Write unit tests with mocked responses (commit a few real samples as fixtures)
- Build a tiny CLI script: `npm run fetch-youtube -- "https://youtube.com/@RyanTolmia"` that prints the structured output
- Run the script against the 7 example leads from `04-youtube-pipeline.md` and confirm the data looks right

### Definition of done
- CLI script returns full structured data for any valid YouTube URL
- The 7 example leads all return correct data
- Scraping the About page works for at least 4 of the 7 (the rest may not have public email — that's fine)
- Quota usage per fetch is ≤ 10 units (confirm with Google Cloud Console dashboard)

### Common pitfalls
- Trying to handle every edge case before any happy path. Get one URL working end-to-end first.
- Using `search.list` instead of `playlistItems.list` for recent videos. The first costs 100 quota units, the second costs 1. Big difference.

---

## Week 3: AI analysis layer

**Primary goal:** Plug in Claude and produce structured analyses that the team would actually find useful.

### Tasks
- Implement `/lib/ai/client.ts`, `analyzer.ts`, etc., per `05-ai-analysis.md`
- Write the system prompt and user prompt template
- Wire up Claude's tool-use API for guaranteed structured output
- Build a CLI: `npm run analyze -- "https://youtube.com/@RyanTolmia"` that combines YouTube fetch + AI analysis and prints the result
- Run on the 7 example leads
- **Calibration loop:** for each lead, compare AI output to the sheet's existing remarks. Note disagreements. Update the prompt. Repeat. Stop after 2–3 iterations.
- Document the calibration findings in `docs/calibration-notes.md`

### Definition of done
- AI returns valid JSON 100% of the time (tool use enforces this)
- Categories assigned by AI are reasonable for all 7 example leads
- Strengths and concerns mostly align with the sheet's existing remarks
- AI confidence is correctly low for sparse-data channels
- Calibration notes document is committed

### Common pitfalls
- Skipping the calibration step and assuming the first prompt is fine. It won't be.
- Trying to get the AI to score the lead. That's the rubric's job, not the AI's.
- Making the prompt too long. Aim for under 3,000 tokens total input.

---

## Week 4: UI + Google Sheets integration

**Primary goal:** Working end-to-end web app.

### Tasks
- Build the login screen (Supabase Auth, magic link)
- Build the enrich form screen
- Build the progress screen
- Build the review & edit screen
- Build the leads list screen
- Implement `/api/enrich` — orchestrates YouTube fetch + AI analysis, saves draft to Supabase, returns lead ID
- Implement `/api/save` — applies edits, computes final score, writes to Google Sheets
- Implement `/api/leads` — list and individual lead fetch endpoints
- Build `scripts/init-sheet.ts` — initializes the Sheets tab structure
- Run end-to-end: log in → enrich → review → save → see in sheet → see in list

### Definition of done
- All five screens work
- Full happy path runs without errors
- A test lead ends up in both Supabase and the Google Sheet correctly
- The team's existing sheet structure can be replicated by `init-sheet.ts`

### Common pitfalls
- Over-styling the UI. It needs to work, not win design awards.
- Doing the Sheets integration last. It often has subtle issues (auth, headers, formatting). Allocate time.
- Forgetting auth on API routes. Every `/api/*` route must check the Supabase session.

---

## Week 5: Polish + error handling

**Primary goal:** Make it robust enough to give to one teammate without hand-holding.

### Tasks
- Handle every failure mode in `04-youtube-pipeline.md` and `05-ai-analysis.md` gracefully
- Add loading states everywhere
- Add toasts for success/error messages
- Add the score breakdown UI on the review screen
- Add the "What is this?" modal explaining the scoring rubric
- Implement the "Discard" action on the review screen
- Add structured logging (every API route logs request, response, errors)
- Set up Sentry (free tier) for error tracking
- Document the system: README in repo, env setup, how to run locally, how to deploy

### Definition of done
- A teammate who hasn't seen the project can sign in and complete an enrichment without help
- All errors show useful messages, not stack traces
- Repo README explains how to set up the project from scratch

### Common pitfalls
- Forgetting to handle the case where YouTube API quota runs out
- Showing raw error messages from the API to users

---

## Week 6: Test + iterate

**Primary goal:** Run it with real leads, gather real feedback, fix the top 3 issues.

### Tasks
- Onboard 1–2 teammates to the tool
- Run the tool on 20 new leads (not the 7 from earlier)
- Sit with the teammates while they use it for at least 5 of those leads — watch where they hesitate or get confused
- Capture every piece of feedback in a `docs/feedback-week-6.md` file
- Categorize feedback: "blocking bug," "annoying," "would be nice"
- Fix all "blocking bug" items
- Fix the top 2–3 "annoying" items
- Skip "would be nice" — that's v2 territory

### Definition of done
- 20 real leads have been enriched and saved to the sheet
- All blocking bugs from real usage are fixed
- Feedback is documented for v2 planning

### Common pitfalls
- Defending the tool when feedback is critical. Just write it down.
- Trying to fix everything. Triage hard.

---

## Buffer (Weeks 7–8)

The brief explicitly says to budget buffer weeks. Real builds always take longer. Use this for:

- Catching up on anything that slipped
- Implementing the memory layer with pgvector (this is the most natural v1.5 feature — see notes below)
- Improving the AI prompt based on real usage data
- Writing the final project writeup

### Optional: Memory layer with pgvector

If everything else is done and there's time:

- Enable pgvector on Supabase
- Create an `embeddings` table with a vector column
- On save, compute an embedding of the lead (channel description + content style + category) using `text-embedding-3-small` (OpenAI's cheap embedding model, or Voyage AI for an alternative)
- Store it
- On a new enrichment, query for the 3 most similar past leads (cosine similarity)
- Pass those similar leads (and their scores + outcomes) to Claude as additional context
- Document the change in `docs/memory-layer.md`

This is the brief's stretch goal. Worth doing if time allows because it's where the system starts getting smarter over time.

### Writeup

Write a 1–2 page document for your manager covering:

- What was built
- What worked well
- What didn't work / what surprised you
- What you'd do differently if starting over
- Recommendations for v2

This is part of the project's deliverable, per the brief.

---

## Cross-cutting practices

These apply across all weeks:

### Notes file

Per the brief: maintain a `notes.md` file in the repo. After each work session, write 3+ sentences: what you tried, what happened, what's next. Especially document the things that didn't work. This is not optional.

### Show broken work early

Don't wait until the end of a week to show your work. After each meaningful change, push to the repo and let the team see it. Bad output that gets fast feedback is faster than perfect output in silence.

### One lead end-to-end before scaling

The fastest path through the project is: get ONE lead working end-to-end across the entire pipeline by end of Week 2, even if hacky. Then improve. Don't try to make every step perfect before integrating.

---

## What to do if you fall behind

You will fall behind on something. When that happens:

1. Note it in `notes.md` honestly
2. Don't try to compress two weeks of work into one
3. Cut scope, not quality: pick the smaller version of the feature instead of skipping testing
4. Use the buffer weeks for catch-up, not for new features

The buffer exists because falling behind is normal. Use it.
