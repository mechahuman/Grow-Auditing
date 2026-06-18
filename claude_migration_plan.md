# Why We're Moving from Groq to Claude

> **Status:** Planning  
> **Decision:** Upgrade AI provider from Groq (Llama 3.3) → Anthropic Claude  
> **Impact:** Better analysis quality + unlocks 4 new features

---

## A Bit of Context

When this tool was first built, Groq was chosen as the AI provider purely for one reason — **it was free during the trial phase**. The project was always designed with Anthropic's Claude as the intended production AI. In fact, the original spec explicitly named Claude.

The codebase was built with this swap in mind. There's already an `AI_PROVIDER` environment variable in the system. Groq was never the destination. It was the starting point.

The trial is done. The tool works. Real leads are being enriched. **It's time to graduate to Claude.**

---

## What's Wrong With Groq Right Now?

Nothing is critically broken — but the gaps show up in quality.

| Problem | How It Appears Today |
|---|---|
| **Generic writing** | The AI Remarks Draft reads like a template. It doesn't feel like a GROW analyst wrote it. |
| **Instruction drift** | Occasionally invents a number or makes a claim not grounded in the data, despite being told not to |
| **Weak nuance** | Misses subtle signals — a creator whose engagement has been quietly declining, a channel with great subs but dead recent videos |
| **JSON fragility** | Under edge cases (unusual channel data, sparse profiles), the structured output sometimes breaks — causing partial enrichment |
| **Low confidence explanation** | The `ai_confidence` field just says "Low" with no reason why. Not actionable. |

---

## Why Claude Is Better For This Tool

### ✍️ It Writes Like a Person, Not a Template

Claude is built for analytical, nuanced writing. When it reads a YouTube channel's data and writes remarks, it sounds like a thoughtful analyst — not a form letter. This matters because the Remarks Draft is what the employee hands to clients and uses internally. Quality here has a direct business impact.

### 📋 It Follows Complex Instructions Precisely

The AI prompt for this tool has strict rules:
- Never invent numbers
- Say "Not visible" instead of guessing
- Ground every observation in real data

Claude follows these rules consistently. Groq/Llama drifts, especially when channel data is sparse or unusual.

### 🔒 More Reliable JSON Output

Claude produces clean, schema-valid JSON on every call — including edge cases like channels with no description, 0 recent videos, or missing contact info. Fewer partial enrichments, fewer silent failures.

### 📐 Bigger Context Window

As the tool grows — more data per lead, richer video analysis — Claude can handle it without truncation. Groq's limits become a ceiling.

---

## 4 New Features That Become Possible

These features are doable because of Claude's stronger reasoning and writing ability. Groq could attempt them, but the output quality wouldn't be reliable enough to use in a real workflow.

---

### 1. 🖊️ Multi-Paragraph Intelligent Remarks

**What changes:** Instead of one generic 2–4 sentence AI draft, Claude writes a proper multi-paragraph analysis in GROW's voice — punchy, opinionated, agency-like.

**Why it matters:** The Remarks field is the most human-facing output of the entire tool. Right now, employees rewrite it almost every time because the draft is too bland. With Claude, the draft becomes a real starting point — not a placeholder.

**Example of what this could look like:**

> *"Ryan's channel punches above its weight. With 14k subscribers averaging 4,200 views per video — a 30% S2V ratio — his audience is unusually engaged for his size. He sells a £14 PDF guide with no upsell funnel in place, which is a clear gap we can address. The concern is posting frequency: he's gone from weekly to roughly once every 3 weeks in Q1 2026, which may reflect bandwidth limitations rather than disinterest. Worth a conversation."*

That's Claude-tier output. That's what the employee currently has to write themselves.

---

### 2. 🚩 AI Red Flag Detection

**What changes:** A new `red_flags` field in the analysis — a list of specific, evidence-backed warning signals Claude detects automatically.

**Why it matters:** Right now, if a channel has quietly gone inactive, or all their recent content is Shorts, or their engagement has dropped 40% in 3 months — the tool doesn't surface this. The employee has to spot it manually. Red flags make the "Concerns" section actually useful instead of generic.

**Example red flags Claude would catch:**
- `"No uploads in 52 days despite 45k subscribers — possible inactive phase"`
- `"All 10 recent videos are YouTube Shorts — may not suit long-form campaign"`
- `"Average views dropped from 18k to 3k across the last 5 videos — significant decline"`
- `"No business email or external links found — cold outreach may be difficult"`
- `"Channel description is blank — limited brand identity signal"`

These are facts from the data, stated plainly. The employee sees them immediately on the review screen.

---

### 3. 📊 AI Confidence Scoring With Explanation

**What changes:** The `ai_confidence` field currently just says Low / Medium / High. With Claude, it explains *why*.

**Why it matters:** "Low confidence" is not actionable. "Low confidence because only 2 recent videos were available and the channel description is empty" tells the employee exactly what's missing — and whether it's worth digging further before making a decision.

**Example output:**

> **Confidence: Low**  
> *Reason: Only 3 videos available for analysis. No channel description. Business email not found. Contact info entirely missing. Analysis is based on limited signals — treat category and monetization fields as estimates.*

The employee now knows this lead needs more manual research before outreach, rather than just seeing a red badge and guessing why.

---

### 4. 📧 Outreach Email Draft Generation

**What changes:** After a lead is saved and reviewed, a new **"Draft Outreach Email"** button appears. Claude reads the full lead profile and generates a personalized cold email in GROW's voice.

**Why it matters:** The natural next step after qualifying a lead is reaching out. Right now, the employee has to switch context, open a blank email, and write from scratch. This feature closes that gap — the AI has all the data it needs (niche, content style, strengths, monetization gaps) to write a genuinely personalized first email.

**Example of what it generates:**

> *"Hey Ryan — came across your channel while looking at ADHD productivity creators. Your engagement rate is seriously impressive for 14k subs, and I noticed you've got a PDF guide but nothing else in your funnel. We work specifically with creators in your space to build that out. Would love to share what we've done for similar channels. Open to a quick call?"*

The employee edits the tone, personalizes further, and sends. The boring part is done.

---

## Cost Reality

Claude does have a cost per API call. Here's what that looks like:

| Volume | Estimated Monthly Cost |
|---|---|
| 50 leads / month | ~₹150 – ₹400 |
| 100 leads / month | ~₹300 – ₹800 |
| 200 leads / month | ~₹600 – ₹1,600 |

**The math is simple:** Enriching one lead manually takes 30+ minutes. At 100 leads/month, that's 50 hours of team time saved. Claude at ₹800/month for that is essentially free in comparison.

---

## What Doesn't Change

- The lead scoring formula stays pure math — no AI involvement there
- The YouTube data pipeline stays exactly the same
- Google Sheets sync stays the same
- Supabase storage stays the same
- The employee still reviews and edits everything — AI is still a research assistant, not a decision maker

---

## Summary

| | Groq (Now) | Claude (Next) |
|---|---|---|
| **Remarks quality** | Generic, template-like | Natural, analytical, GROW-voiced |
| **JSON reliability** | Occasional edge case breaks | Consistent, schema-valid |
| **Instruction following** | Drifts on sparse data | Precise and consistent |
| **Red flags** | ❌ Not detected | ✅ Surfaced automatically |
| **Confidence explanation** | Just a label | Label + clear reason |
| **Outreach email draft** | ❌ Not possible | ✅ One-click from lead profile |
| **Cost** | ₹0 (free tier) | ~₹3–8 per lead |

---

*This is not a pivot. The tool was always designed for Claude. This is the upgrade that was planned from day one.*
