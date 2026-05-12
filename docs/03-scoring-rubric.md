# 03 — Scoring Rubric

The lead score is a single number from 1 to 5, computed from four factors. Three are mechanical (system computes them from data). One is human (employee enters it).

---

## The four factors

### 1. YT Score Factor

Does the lead have a YouTube link?

| Condition | Value |
|---|---|
| YouTube URL present and valid | 1 |
| YouTube URL missing or invalid | 0 |

> In v1, this is always `1` since the form requires a YouTube URL. We still compute it explicitly so the rubric is future-proof when Instagram-only leads enter the system.

### 2. Sub Range Factor

How big is the channel?

| Subscriber count | Value |
|---|---|
| 0 – 999 | 0 |
| 1,000 – 4,999 | 0.5 |
| 5,000+ | 1 |

> Tiers updated 2026-05-13: 5,000+ is the full-score threshold (no upper cap — clients above 10k also score 1). Keep these as constants in a config file (`lib/scoring/config.ts`) so they're easy to tune without hunting through the code.

### 3. S2V Factor (Subscribers-to-Views Ratio)

Are recent videos actually getting watched relative to the subscriber base?

**Calculation:**
```
S2V Ratio % = (avg_views_last_10 / subscriber_count) * 100
```

**Scoring:**

| S2V Ratio | Value |
|---|---|
| ≥ 10% | 1 |
| < 10% | 0 |

**Edge cases:**
- If subscriber_count is 0 → S2V Factor = 0
- If avg_views_last_10 can't be computed (no recent videos) → S2V Factor = 0
- If channel has fewer than 3 videos total → S2V Factor = 0 and flag as `low_data`

### 4. G-Factor (Gut Instinct)

The employee's gut feel for the lead, on a 1–5 scale.

| G-Factor (raw) | Normalized value |
|---|---|
| 1 | 0.0 |
| 2 | 0.25 |
| 3 | 0.5 |
| 4 | 0.75 |
| 5 | 1.0 |

The form accepts 1–5 directly. The system normalizes to 0–1 for the scoring formula below.

---

## The formula

```
raw_total = yt_score_factor + sub_range_factor + s2v_factor + g_factor_normalized
          (each is 0 to 1, so raw_total is 0 to 4)

lead_score_total = 1 + (raw_total / 4) * 4
                 = 1 + raw_total
```

Wait — that simplifies. Let me write it cleanly:

```
lead_score_total = 1 + (yt + sub + s2v + g_norm)
```

This maps:
- All factors at 0 → score of 1 (worst)
- All factors at 1 → score of 5 (best)
- Linear scaling in between

The result is rounded to 1 decimal place.

### Worked example

Lead: a creator with a YouTube channel, 5,000 subscribers, average 800 views on last 10 videos, and the employee gave a G-Factor of 4.

```
yt_score_factor       = 1                            (has YT)
sub_range_factor      = 1                            (5k is in 5k+ tier → full score)
s2v_factor            = 1                            (800/5000 = 16% ≥ 10%)
g_factor_normalized   = 0.75                         (G-Factor 4 → 0.75)

raw_total             = 1 + 1 + 1 + 0.75 = 3.75
lead_score_total      = 1 + 3.75 = 4.75
```

Final lead score: **4.8** (rounded to 1 decimal).

### Another example (weaker lead)

Lead: a creator with 200 subscribers, average 15 views on last 10 videos, employee gut feeling of 2.

```
yt_score_factor       = 1
sub_range_factor      = 0                            (under 1k)
s2v_factor            = 0                            (15/200 = 7.5% < 10%)
g_factor_normalized   = 0.25                         (G-Factor 2)

raw_total             = 1 + 0 + 0 + 0.25 = 1.25
lead_score_total      = 1 + 1.25 = 2.25
```

Final lead score: **2.3**

---

## Score-to-recommendation mapping

The system does NOT make accept/reject recommendations in v1 (per the project philosophy — humans decide). But it can label the score for visual cue on the UI:

| Score range | Label | Color (UI hint) |
|---|---|---|
| 4.0 – 5.0 | Strong fit | green |
| 3.0 – 3.9 | Solid fit | blue |
| 2.0 – 2.9 | Weak fit | yellow |
| 1.0 – 1.9 | Poor fit | red |

Display the label and color on the review screen and the leads list. Do not auto-reject anything based on score.

---

## Implementation notes

Put scoring logic in `lib/scoring/`:

```
/lib/scoring/
  config.ts          # Tier thresholds, can be edited without touching logic
  factors.ts         # Pure functions: computeYtFactor, computeSubRangeFactor, etc.
  total.ts           # The final formula
  index.ts           # Public API
```

All functions should be **pure** (no side effects, no API calls). This makes them trivially testable. Write unit tests for each factor and for the final formula with the two worked examples above.

```typescript
// Example signature for the public API
export function computeLeadScore(input: {
  hasYouTube: boolean;
  subscriberCount: number;
  avgViewsLast10: number | null;
  gFactor: 1 | 2 | 3 | 4 | 5;
}): {
  ytScoreFactor: number;
  subRangeFactor: number;
  s2vFactor: number;
  gFactorNormalized: number;
  s2vRatioPct: number | null;
  leadScoreTotal: number;
  label: 'Strong fit' | 'Solid fit' | 'Weak fit' | 'Poor fit';
}
```

---

## Why this rubric is intentionally simple

This rubric uses 4 factors. A "real" lead scoring model could use 30+. We deliberately kept it small for v1 because:

1. **Manav can mentally verify the score** — if it looks wrong, he can trace why in 5 seconds
2. **The rubric is the company's stated rubric** — not invented by the system
3. **G-Factor carries 25% of the weight** — this preserves human judgment in the score itself
4. **More factors will be added later** — once we see how this performs on real leads, factors like "posting frequency," "comment quality," "channel age," etc. can be added

When adding new factors later, update this file first, then `config.ts`, then add the corresponding factor function.

---

## Open questions on the rubric (for v2+)

These are deliberately not in v1:

- Should Sub Range have more granularity above 5k (e.g., 50k+ scoring differently)?
- Should S2V Factor be continuous (e.g., 0.5 for 5–10%, 1.0 for 10%+) rather than binary?
- Should "posting frequency" be a factor?
- Should "monetization clarity" (has a visible product/offer) be a factor?

Capture user feedback after the first 20–30 real enrichments before deciding.
