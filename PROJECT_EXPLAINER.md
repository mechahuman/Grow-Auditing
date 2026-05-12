# 🔍 GROW Lead Intelligence & Scouting System — Project Explainer

> **Who this is for:** Anyone who wants to understand what this project is, why it exists, how it works, and how it's being built — without needing to be technical.

---

## 🧠 The One-Paragraph Summary

GROW is a digital marketing company that helps YouTube creators grow their businesses. The team scouts YouTube creators who might be good clients. Before this tool, scouting a single creator meant **30+ minutes of manual research** — checking subscriber counts, watching videos, Googling contact info, writing notes by hand. This tool cuts that to **~60 seconds**. An employee pastes a YouTube URL, answers 3 quick questions, and the system automatically fetches all the data, scores the lead, and writes a draft analysis using AI. The employee reviews, edits if needed, and saves — done.

---

## 🎯 The Problem We're Solving

### Before this tool existed:
When a team member found a promising YouTube creator, they had to:
1. Manually go to YouTube and note the subscriber count, view counts, posting frequency
2. Click through to their bio to find a business email (often buried or missing)
3. Search for their website, other social links
4. Form an opinion on whether the creator was a good fit
5. Type up "remarks" about the creator (what they make, how they monetize, strengths, concerns)
6. Copy all this into a Google Sheet row
7. Score the lead using the team's rubric (done mentally or with a calculator)

That's **30+ minutes per creator.** If the team scouts 5 creators in a day, that's 2.5+ hours of repetitive data entry.

### After this tool:
1. Paste YouTube URL + fill in 3 fields (takes 30 seconds)
2. Wait ~60 seconds (the tool does everything automatically)
3. Review the pre-filled results, edit where needed
4. Click Save

That's it. The tool writes everything to the team's Google Sheet automatically.

---

## 📐 The Core Philosophy

> **"The AI does the research. A human makes the call. That order never changes."**

This is NOT a tool that makes decisions for you. It's a **research assistant** that drafts a structured first-pass for a human to review. Everything the AI writes is editable. The employee always has the final say. The tool just removes the boring parts.

---

## 🔄 How It Works — Step by Step

Here's exactly what happens from the moment an employee opens the tool to when the lead is saved.

---

### Step 1: Employee Opens the Tool & Fills the Form

The tool is a web app (accessible in any browser). The employee logs in and clicks **"New Lead"**.

They fill in:
- **Lead Name** — the creator's name (e.g., "Ryan Tolmia")
- **Found By** — which team member found this lead (dropdown of team initials)
- **YouTube URL** — the creator's YouTube channel link
- **G-Factor (1–5)** — the employee's gut feeling about this lead. 1 = "I'm not excited," 5 = "This feels like a great fit." (More on this below.)
- **Email / Website** (optional) — if already known, fill these in; otherwise the system will try to find them automatically

Then they click **"Enrich Lead"** and wait.

---

### Step 2: The System Fetches All YouTube Data (Automatically)

The backend (the behind-the-scenes part of the app) immediately goes to work. Here's what it does, in order:

#### 2a. Parse the YouTube URL
The system reads the URL and figures out the channel's unique ID. It handles all YouTube URL formats:
- `youtube.com/@RyanTolmia`
- `youtube.com/channel/UC...`
- `youtube.com/c/RyanTolmia` (legacy format)

#### 2b. Fetch Channel Info (YouTube API)
Using YouTube's official data feed (called the **YouTube Data API v3**), it fetches:
- **Subscriber count** — how big is the audience?
- **Total channel views** — overall reach over the channel's lifetime
- **Total video count** — how prolific is the creator?
- **Channel creation date** — how long have they been around?
- **Channel description / bio** — what does the creator say about themselves?

#### 2c. Fetch Recent Videos (YouTube API)
It then pulls the last 10–15 videos and fetches stats for each:
- **Views per video** — how is recent content performing?
- **Likes and comments** — is the audience engaged?
- **Video titles and descriptions** — what topics does this creator make content about?
- **Upload dates** — when did they last post? How consistently do they post?

From this, it calculates:
- **Average views (last 10 videos)** — a key measure of recent performance
- **Posting frequency (last 30 days)** — are they active or quiet?
- **Last upload date** — are they still posting?

#### 2d. Scrape the "About" Page
It also visits the creator's YouTube `/about` page and looks for:
- **Business email** — if the creator has listed a contact email
- **External links** — website, Twitter, Instagram, etc.

If it can't find these, it leaves the fields blank. This step always "fails gracefully" — the rest of the enrichment still works fine without it.

---

### Step 3: The System Computes a Lead Score (No AI — Pure Math)

Before the AI is involved, the system computes a **numerical lead score** using a fixed rubric. The score is on a **1–5 scale**.

The score is made up of 4 factors:

| Factor | What it measures | How it scores |
|---|---|---|
| **YT Factor** | Does this lead have a YouTube channel? | Always 1 in v1 (YouTube URL is required) |
| **Sub Range Factor** | How big is the channel? | 0–999 subscribers = 0 pts, 1k–4,999 = 0.5 pts, 5k+ = 1 pt |
| **S2V Factor** | Are subscribers actually watching? (engagement health) | Avg views ÷ subscribers × 100. If ≥ 10% = 1 pt, if < 10% = 0 pts |
| **G-Factor** | Employee's gut instinct (1–5) | Normalized: 1→0, 2→0.25, 3→0.5, 4→0.75, 5→1 |

**Formula:**
```
Lead Score = 1 + (YT Factor + Sub Range Factor + S2V Factor + G-Factor normalized)
```

**Example:** Creator with 5,000 subs, avg 800 views per video, employee gave G-Factor 4:
```
YT Factor = 1  (has YouTube)
Sub Range = 1  (5k hits the 5k+ tier → full score)
S2V = 1  (800÷5000 = 16% ≥ 10%)
G-Factor normalized = 0.75  (4 → 0.75)

Score = 1 + (1 + 1 + 1 + 0.75) = 4.75 → "Strong Fit 🟢"
```

**Score Labels:**
- 🟢 **4.0–5.0** = Strong Fit
- 🔵 **3.0–3.9** = Solid Fit
- 🟡 **2.0–2.9** = Weak Fit
- 🔴 **1.0–1.9** = Poor Fit

> The score **never auto-accepts or auto-rejects** a lead. It's a visual aid. A human always decides what to do next.

---

### Step 4: The AI Writes a Structured Analysis (Claude AI)

Now the AI comes in. The system sends all the YouTube data to **Claude** (an AI made by Anthropic, similar to ChatGPT but known for analytical writing) and asks it to produce a structured analysis.

The AI is given a clear role: *"You are a lead analyst for a digital marketing agency. Read this channel's data and write factual, evidence-based observations."*

**What the AI produces:**

| Field | Example Output |
|---|---|
| **Category** | "ADHD productivity creator" |
| **Content Style** | "Talking-head tutorials, casual production" |
| **Monetization** | "Sells a £14 PDF guide; link in bio" |
| **Posting Pattern** | "Weekly, consistent" |
| **Strengths** | ["Clear niche focus", "Engagement above channel-size norm"] |
| **Concerns** | ["No visible CTA in recent videos", "Posting dropped to monthly in last 90 days"] |
| **Remarks Draft** | A 2–4 sentence paragraph summarizing the lead (employee can edit this) |
| **AI Confidence** | Low / Medium / High — based on how much data was available |
| **Data Gaps** | Things the AI couldn't determine ("Could not access website") |

**Key rules the AI must follow:**
- Never invent numbers or guess revenue
- Every observation must be anchored to real data from the channel
- If something isn't visible, say "Not visible" — don't speculate
- Keep it neutral in tone — the employee adds personality when editing

---

### Step 5: Employee Reviews and Edits

The tool shows the employee a **Review & Edit screen** split into two sections:

**Left side (read-only):** All the raw YouTube data — subscriber count, recent videos, posting stats, etc.

**Right side (editable):** Everything the system and AI filled in, with the ability to edit any field:
- Lead name, email, website
- Category, content style, monetization
- Remarks (pre-filled with AI draft — the employee can rewrite this)
- Status (new lead, mail sent, call booked, etc.)

The lead score is shown prominently at the top with a breakdown of each factor. If the employee changes the G-Factor here, the score updates in real-time.

There's also a **"Show original AI draft"** toggle below the remarks — so the employee can always see what the AI originally wrote even after editing it.

---

### Step 6: Employee Saves the Lead

Click **"Save Lead"** and two things happen simultaneously:

1. **Written to Supabase (the internal database)** — the full record is saved, including the raw AI response, the raw YouTube data, timestamps, and everything else
2. **Written to Google Sheets (the team's spreadsheet)** — a new row is appended to the team's master lead tracker

The employee then sees the lead appear in both the tool's internal list and the team's Google Sheet.

If the employee decides this lead isn't worth saving, they click **"Discard"** and the draft is deleted.

---

## 🗂️ Where the Data Lives (Two Storage Layers)

The system stores data in two places on purpose:

| Storage | What it is | What it's for |
|---|---|---|
| **Google Sheets** | The team's shared spreadsheet | Day-to-day lead tracking, outreach status, reporting — the team's main workspace |
| **Supabase (Postgres database)** | A proper database | Full historical record, raw AI responses, raw YouTube data, audit trail, foundation for future smart features |

> **Think of it like this:** Google Sheets is the whiteboard everyone reads. Supabase is the filing cabinet with the complete file. Both get updated on every save.

---

## 🖥️ The 5 Screens of the App

The tool has 5 screens (pages):

1. **Login** — simple email + password login (powered by Supabase Auth)
2. **Leads List** — table of all past leads, with filters ("Strong Fit," "Mine," etc.) and a search bar
3. **Enrich Form** — the input form where the employee pastes the YouTube URL
4. **Progress Screen** — shown while the enrichment runs (~60 seconds), with live status messages
5. **Review & Edit Screen** — the main screen where the employee sees, edits, and saves the enriched lead

---

## 🛠️ Tech Stack — Every Tool and Why We Chose It

Here's every technology used, explained plainly:

---

### 1. Next.js 14 (Frontend + Backend)
**What it is:** A web framework built on React (a popular way to build websites). It handles both the visual interface employees see AND the behind-the-scenes logic — in the same codebase.

**Why we chose it:**
- One language (TypeScript/JavaScript) for everything — no switching between frontend and backend
- Deploys for free on Vercel with zero configuration
- API routes built-in (no need for a separate server)

---

### 2. Supabase (Database + Authentication)
**What it is:** A cloud-hosted Postgres database with extras: built-in user authentication, real-time updates, and future AI features (via pgvector).

**Why we chose it:**
- Free tier is more than enough for the trial phase (500MB database)
- Built-in login system — no need to build auth from scratch
- Standard SQL (no lock-in, portable if we ever switch)
- Supports pgvector — a future feature that could make the AI smarter by learning from past leads

---

### 3. Google Sheets API
**What it is:** A programmatic way to write data to a Google Spreadsheet (like writing to a shared file automatically).

**Why we chose it:**
- The team already works in Google Sheets — this tool writes directly into their existing workflow
- No learning curve for the team; they already know how to use a spreadsheet
- Free to use

---

### 4. YouTube Data API v3
**What it is:** YouTube's official feed of public channel data — subscriber counts, video stats, etc.

**Why we chose it:**
- Free (10,000 quota units/day — easily enough for 1,000+ leads per day)
- Official and reliable — no scraping of the main YouTube data
- Provides everything: subscribers, views, video titles, posting dates

---

### 5. Groq (AI Provider — for the trial phase)
**What it is:** A company that provides AI language models with extremely fast processing speeds. Compatible with the same API standard as OpenAI.

**Why we chose it for the trial:**
- **Free tier** — no cost during the trial phase
- Very fast response times (faster than most alternatives)
- Easy to switch out: the code is designed with a provider abstraction (`AI_PROVIDER` env variable), so if we want to switch to Claude (Anthropic) or GPT-4 (OpenAI) later, we change one config value — not the codebase

> **Note:** The original spec specified Anthropic Claude. After review, we decided to use Groq for the free trial phase. The system is designed so switching AI providers requires no code changes — just an environment variable update.

---

### 6. Vercel (Hosting)
**What it is:** A hosting platform that automatically deploys Next.js apps. Think of it as the "server" that the web app lives on.

**Why we chose it:**
- Free tier for our usage level
- Zero configuration — connect GitHub, it deploys automatically on every push
- Handles HTTPS, CDN, scaling automatically

---

### 7. Cheerio (HTML Scraping)
**What it is:** A lightweight library for reading and parsing HTML pages in Node.js.

**Why we use it:**
- Used to scrape the YouTube `/about` page for business email and external links
- These aren't available via the official API, so we do a lightweight page fetch
- Much simpler than running a full browser — just reads the page's HTML

---

### 8. TypeScript
**What it is:** JavaScript with type safety — a way of writing code that catches errors before the app runs.

**Why we use it:**
- The data structures in this project (leads, YouTube data, AI output) are complex — TypeScript helps ensure fields are never mismatched
- Industry standard for serious Next.js projects

---

## 📊 The Data — What Gets Stored Per Lead

Every lead record contains:

| Category | Fields |
|---|---|
| **Human input** | Lead name, who found them, G-Factor score |
| **YouTube stats** | Subscriber count, total views, video count, channel age, last upload |
| **Computed stats** | Average views (last 10), S2V ratio %, posting frequency (30 days) |
| **Scraped** | Business email, website link |
| **AI-classified** | Category, content style, monetization/product |
| **AI-generated** | Strengths list, concerns list, remarks draft, data gaps, confidence level |
| **Scoring** | Each factor's value, final lead score |
| **Workflow** | Status (new/mail sent/replied/call booked/closed), status notes |
| **Audit** | Who enriched this lead, when, full raw AI response, full raw YouTube API response |

---

## 🗓️ Build Plan — 6 Weeks + 2 Buffer

The project is planned across 8 weeks:

| Week | Goal | Key Deliverable |
|---|---|---|
| **Week 1** | Setup + calibration | Dev environment working, Manav manually scores 15 leads to build a baseline for AI comparison |
| **Week 2** | YouTube pipeline | Given any YouTube URL → get all structured channel data (end-to-end CLI test) |
| **Week 3** | AI analysis | Claude/Groq produces useful, calibrated analyses — tested against the 7 example creators |
| **Week 4** | Full web app + Google Sheets | All 5 screens built, full happy path works, data writes to Sheet |
| **Week 5** | Polish + error handling | Every error handled gracefully, logging, teammate can use it without help |
| **Week 6** | Real usage + feedback | 20 real leads enriched, feedback collected, bugs fixed |
| **Weeks 7–8** | Buffer | Catch-up, optional: AI memory layer (similar past leads surface during enrichment) |

---

## 💰 How Much Does This Cost to Run?

During the trial phase (50–100 leads/month):

| Service | Cost |
|---|---|
| Vercel (hosting) | ₹0 |
| Supabase (database + auth) | ₹0 |
| YouTube Data API | ₹0 |
| Google Sheets API | ₹0 |
| Groq (AI — trial phase) | ₹0 (free tier) |
| **Total** | **~₹0/month during trial** |

If we switch to Anthropic Claude in production:
- ~₹3–8 per enrichment in Claude API costs
- At 200 leads/month → ₹600–₹1,600/month

Still very cheap for what it replaces.

---

## 🚧 What's In vs. Out for Version 1

### ✅ In Scope (v1)
- YouTube-only data fetching
- AI-generated analysis and remarks draft
- Computed lead score (4-factor rubric)
- Review and edit before saving
- Google Sheets as the team's primary view
- Supabase as the internal database
- Login / authentication for team members
- Internal leads list with search and filters

### ❌ Out of Scope (v1 — planned for v2+)
- Instagram, TikTok, LinkedIn support
- Re-enriching a lead (refreshing its YouTube data later)
- Bulk processing (queuing 20 URLs at once)
- Analytics dashboard / charts
- Email/outreach automation
- AI memory layer (surfacing similar past leads) — possible in buffer weeks
- PDF report export
- Two-way sync with Google Sheets

---

## 🔑 Key Design Decisions (and Why)

| Decision | What we chose | Why |
|---|---|---|
| Auth method | Email + password | Simpler than magic link; team prefers it |
| AI provider | Groq (trial) → Anthropic Claude (production option) | Groq is free for trial; abstraction layer means easy switch |
| Data storage | Supabase (primary) + Google Sheets (mirror) | Team works in Sheets; Supabase keeps the rich data |
| YouTube video fetch | `playlistItems.list` (1 API unit) | The alternative (`search.list`) costs 100 units — 100x more expensive |
| AI scoring | ❌ AI does NOT compute the score | Score is pure math (rubric). AI only writes observations. Keeps scoring auditable and verifiable. |
| Sheet sync direction | One-way only (tool → Sheet) | Two-way sync is complex and error-prone. Sheet is read-only from the system's perspective. |
| Timeout budget | ~60 seconds | Fits within Vercel's free-tier serverless function limit |

---

## 🔮 The Bigger Picture — Where This Could Go

The current system is deliberately minimal. But the foundation is designed for growth:

- **Memory layer** (future): When enriching a new lead, the system could surface "3 similar past leads" — what scored well, what didn't, what outcomes they had. This makes the AI smarter over time.
- **Instagram support**: The data model already has room for non-YouTube platforms.
- **Bulk enrichment**: Queue multiple URLs and process overnight.
- **Outreach automation**: When status changes to "mail sent," auto-fill an email template.
- **Analytics**: Over time, which channel sizes, niches, and content styles actually convert to clients? This data will show it.

---

## 🧭 How to Explain This to Someone in 60 Seconds

> *"We're building an internal research tool for our team that scouts YouTube creators as potential clients. Right now, researching one creator takes 30+ minutes manually. This tool cuts it to 60 seconds — you paste their YouTube URL, it automatically pulls all their stats, scores them on our rubric, and uses AI to write a first-draft analysis. The employee reviews everything, edits if needed, and saves it directly to our Google Sheet. It's not a decision-making tool — it just removes the boring data-collection part so our team can focus on judgment calls."*

---

*Document written from docs: `README.md`, `01-architecture.md` through `10-open-decisions.md`, `notes.md`*
*Last updated: 2026-05-13*
