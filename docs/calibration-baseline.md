# AI Calibration Baseline: Manual Scoring

**Objective:** Before we write the AI system prompt, we need a baseline of human-scored leads. This document serves as the ground truth. We will use these examples to calibrate the AI so it learns exactly how you want it to analyze channels and write remarks.

**What to fill in:** G-Factor (1–5) and the Human Remark / Analysis for each lead. Everything else was retrieved live from the YouTube pipeline.

**Score formula:** `1 + (YT factor + Sub Range factor + S2V factor + G-factor normalized)`
- YT factor: 1 if channel exists, 0 if not
- Sub Range: 0 → <1k subs | 0.5 → 1k–4,999 | 1 → 5k+
- S2V: 1 if avg views / subscribers ≥ 10%, else 0
- G-factor normalized: (G − 1) / 4 → maps 1–5 to 0–1

---

## Lead 1: Tom's AI Insights

| Field | Value |
|---|---|
| **Channel URL** | https://www.youtube.com/@TomsAIInsights |
| **Subscribers** | 28 |
| **Total Views** | 1,704 |
| **Video Count** | 20 |
| **Channel Created** | 2026-05-02 (11 days old at time of fetch) |
| **Last Upload** | 2026-05-12 |
| **Avg Views (last 10 videos)** | 62 |
| **S2V Ratio** | 221.4% |
| **Posts Last 30 Days** | 15 |
| **Website** | — |
| **Email** | — |

**Recent Videos (top 5):**
- 2026-05-12 — 9 views — "Why Google is Killing Your Site — And How Claude Can Save It"
- 2026-05-12 — 69 views — "The $14,000 AI Side Hustle Nobody is Talking About 🤫"
- 2026-05-10 — 25 views — "Turn Any YouTube Video Into an AI Skill"
- 2026-05-10 — 154 views — "The New Open Claw Killer Remy"
- 2026-05-10 — 119 views — "Claude is Weak Until You Do This."

**Scoring Breakdown:**

| Factor | Score | Reason |
|---|---|---|
| YT Score Factor | 1 | Has YouTube channel |
| Sub Range Factor | 0 | 28 subscribers (< 1,000) |
| S2V Factor | 1 | 221.4% >> 10% threshold |
| G-Factor | ___ / 5 | ← Fill in |
| G-Factor Normalized | ___ | (G − 1) / 4 |
| **Total Score** | ___ | 1 + (1 + 0 + 1 + G_norm) |

**Human Remark / Analysis:**
> *(Your manual analysis here — what kind of creator is this, why are they a good/bad fit, what stands out?)*

---

## Lead 2: Filipe Teixeira

| Field | Value |
|---|---|
| **Channel URL** | https://www.youtube.com/@FilipeTeixeira_TennisCoach |
| **Subscribers** | 56,500 |
| **Total Views** | 71,748,353 |
| **Video Count** | 1,487 |
| **Channel Created** | 2020-08-30 (~4.7 years old) |
| **Last Upload** | 2026-05-13 |
| **Avg Views (last 10 videos)** | 16,122 |
| **S2V Ratio** | 28.5% |
| **Posts Last 30 Days** | 15 |
| **Website** | https://filipe-teixeira-shop.fourthwall.com/products/forehand-mastery-program |
| **Email** | — |

**Recent Videos (top 5):**
- 2026-05-13 — 741 views — "Forehand Technique Fix for Tennis Beginners. #tennis"
- 2026-05-13 — 2,722 views — "#1 Tennis Forehand Volley Drill (My Favorite)"
- 2026-05-12 — 8,088 views — "#1 Forehand Lesson for Intermediate Players (Do This)"
- 2026-05-12 — 34,687 views — "Secret Hack for High Forehand (Technique Fix)"
- 2026-05-12 — 14,729 views — "The ONLY One-Handed Backhand Grip You Need."

**Scoring Breakdown:**

| Factor | Score | Reason |
|---|---|---|
| YT Score Factor | 1 | Has YouTube channel |
| Sub Range Factor | 1 | 56,500 subscribers (5k+) |
| S2V Factor | 1 | 28.5% >> 10% threshold |
| G-Factor | ___ / 5 | ← Fill in |
| G-Factor Normalized | ___ | (G − 1) / 4 |
| **Total Score** | ___ | 1 + (1 + 1 + 1 + G_norm) |

**Human Remark / Analysis:**
> *(Your manual analysis here)*

---

## Lead 3: Dakota James Spicer

| Field | Value |
|---|---|
| **Channel URL** | https://www.youtube.com/@dakotajamesspicer |
| **Subscribers** | 1,830 |
| **Total Views** | 702,408 |
| **Video Count** | 183 |
| **Channel Created** | 2008-11-07 (~17 years old) |
| **Last Upload** | 2026-04-22 |
| **Avg Views (last 10 videos)** | 2,766 |
| **S2V Ratio** | 151.1% |
| **Posts Last 30 Days** | 1 |
| **Website** | — |
| **Email** | — |

**Recent Videos (top 5):**
- 2026-04-22 — 2,203 views — "The Iron Heart story needs to be studied"
- 2026-04-11 — 917 views — "Denim in the Philippines"
- 2026-04-09 — 2,862 views — "Denim history in the Philippines"
- 2026-04-08 — 872 views — "The Evisu Paradox"
- 2026-04-07 — 900 views — "Denim Armor in Osaka"

**Scoring Breakdown:**

| Factor | Score | Reason |
|---|---|---|
| YT Score Factor | 1 | Has YouTube channel |
| Sub Range Factor | 0.5 | 1,830 subscribers (1k–4,999) |
| S2V Factor | 1 | 151.1% >> 10% threshold |
| G-Factor | ___ / 5 | ← Fill in |
| G-Factor Normalized | ___ | (G − 1) / 4 |
| **Total Score** | ___ | 1 + (1 + 0.5 + 1 + G_norm) |

**Human Remark / Analysis:**
> *(Your manual analysis here)*

---

## Lead 4: JZ Helps — Justin Ziegler (Florida Injury Law Firm)

| Field | Value |
|---|---|
| **Channel URL** | https://www.youtube.com/@RealJustinZiegler |
| **Subscribers** | 16,000 |
| **Total Views** | 4,432,247 |
| **Video Count** | 257 |
| **Channel Created** | 2015-06-07 (~10.9 years old) |
| **Last Upload** | 2026-05-05 |
| **Avg Views (last 10 videos)** | 270 |
| **S2V Ratio** | 1.7% |
| **Posts Last 30 Days** | 4 |
| **Website** | — |
| **Email** | — |

**Recent Videos (top 5):**
- 2026-05-05 — 293 views — "You Need THIS To Know Your Injury Case Value"
- 2026-04-29 — 249 views — "Insurance Adjusters Don't Want You Seeing This"
- 2026-04-19 — 251 views — "Surgery COULD Destroy Your Settlement"
- 2026-04-15 — 94 views — "Dog Bite Claim Steps That Get You Paid Big"
- 2026-04-09 — 154 views — "How E-Scooter Accident Claims Work"

**Scoring Breakdown:**

| Factor | Score | Reason |
|---|---|---|
| YT Score Factor | 1 | Has YouTube channel |
| Sub Range Factor | 1 | 16,000 subscribers (5k+) |
| S2V Factor | 0 | 1.7% — far below 10% threshold |
| G-Factor | ___ / 5 | ← Fill in |
| G-Factor Normalized | ___ | (G − 1) / 4 |
| **Total Score** | ___ | 1 + (1 + 1 + 0 + G_norm) |

**Human Remark / Analysis:**
> *(Your manual analysis here)*

---

## Lead 5: Dan Does Game

| Field | Value |
|---|---|
| **Channel URL** | https://www.youtube.com/@DanDoesGame |
| **Subscribers** | 79,700 |
| **Total Views** | 7,987,491 |
| **Video Count** | 492 |
| **Channel Created** | 2013-02-22 (~13.2 years old) |
| **Last Upload** | 2026-05-11 |
| **Avg Views (last 10 videos)** | 4,748 |
| **S2V Ratio** | 6% |
| **Posts Last 30 Days** | 4 |
| **Website** | — |
| **Email** | — |

**Recent Videos (top 5):**
- 2026-05-11 — 3,400 views — "I Bought 13 EMULATION CONSOLES... Every Console Died But…"
- 2026-05-02 — 2,257 views — "I Tested THE TOP SELLING Retro Console... But Got This"
- 2026-04-27 — 2,157 views — "I Tested 2 EMULATION CONSOLES More Fun Than My Odin 2 P…"
- 2026-04-20 — 4,720 views — "I Tested THE BEST $80 EMULATION CONSOLE… Here's Proof"
- 2026-04-12 — 6,691 views — "I Tested THE BEST EMULATION CONSOLE… Here's Proof 🤯"

**Scoring Breakdown:**

| Factor | Score | Reason |
|---|---|---|
| YT Score Factor | 1 | Has YouTube channel |
| Sub Range Factor | 1 | 79,700 subscribers (5k+) |
| S2V Factor | 0 | 6% — below 10% threshold |
| G-Factor | ___ / 5 | ← Fill in |
| G-Factor Normalized | ___ | (G − 1) / 4 |
| **Total Score** | ___ | 1 + (1 + 1 + 0 + G_norm) |

**Human Remark / Analysis:**
> *(Your manual analysis here)*

---

## Leads 6–15

*To be added. Mix in more variety — aim for at least 2–3 "poor fit" leads (low score) alongside the strong/solid fits above.*
