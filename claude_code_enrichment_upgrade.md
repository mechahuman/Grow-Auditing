# Claude Code Task: Enrichment Upgrade — 15 New Data Points

> Feed this entire file to Claude Code. Do not skip any section.
> Do not ask clarifying questions — all decisions are made below.
> Work through the task in the order written.

---

## 1. Project Overview

This is a **Next.js 14 TypeScript** app called the GROW Audit Tool. It lets GROW's team members paste a YouTube channel URL, automatically enrich it with data from the YouTube API and an AI, score the lead, and save it to Supabase and Google Sheets.

**Tech stack:**
- Framework: Next.js 14 (App Router)
- Language: TypeScript (strict)
- Database: Supabase (Postgres + RLS)
- AI: Groq SDK (model: `llama-3.3-70b-versatile`) — called via `lib/ai/client.ts`
- YouTube: YouTube Data API v3 via `lib/youtube/`
- Styling: Tailwind CSS

---

## 2. Current Architecture — Files You Will Touch

```
lib/
  youtube/
    types.ts          ← TypeScript interfaces for YouTube data
    channels.ts       ← calls YouTube channels.list API
    videos.ts         ← calls YouTube playlistItems.list + videos.list API
    orchestrator.ts   ← assembles all YouTube data into YouTubeEnrichmentResult
    aboutScraper.ts   ← scrapes YouTube /about page for email + social links
  ai/
    types.ts          ← ChannelAnalysis and AnalysisResult interfaces
    systemPrompt.ts   ← the AI system prompt string
    promptBuilder.ts  ← builds the user-facing prompt sent to the AI
    analyzer.ts       ← calls AI, parses and validates JSON response

app/
  api/
    enrich/route.ts   ← POST /api/enrich — main enrichment endpoint
    re-enrich/route.ts← POST /api/re-enrich — re-runs enrichment on existing lead

supabase/
  migrations/         ← SQL migration files (numbered 0001 through 0013)
```

**The review/edit UI** lives in `app/(authenticated)/leads/[id]/review/` and `app/(authenticated)/leads/[id]/edit/`. You will need to update these to display the new fields.

---

## 3. What You Are Building

Add **15 new data points** to the enrichment pipeline. Every new field must be:
1. Computed/fetched during enrichment
2. Stored in the `leads` table via a new migration
3. Saved in `app/api/enrich/route.ts` and `app/api/re-enrich/route.ts`
4. Displayed on the lead review/edit screen in a well-formatted, aesthetically pleasing way

---

## 4. Complete List of New Fields

### Group A — Computed from already-fetched video data (no new API calls)

| Field | Column Name | Type | How to Compute |
|---|---|---|---|
| Shorts % | `shorts_pct` | `numeric(5,2)` | % of recent videos where `durationSec < 60`. Round to 1 decimal. |
| Avg like rate | `avg_like_rate_pct` | `numeric(6,3)` | For each video: `likeCount / viewCount * 100`. Average across last 10 non-zero-view videos. Round to 2 decimals. |
| Avg comment rate | `avg_comment_rate_pct` | `numeric(6,3)` | For each video: `commentCount / viewCount * 100`. Average across last 10 non-zero-view videos. Round to 2 decimals. |
| Avg video duration | `avg_duration_sec` | `integer` | Average `durationSec` across last 10 videos. Integer seconds. |
| Top recent video title | `top_video_title` | `text` | Title of the video with the highest `viewCount` from the recent fetch |
| Top recent video URL | `top_video_url` | `text` | `https://youtube.com/watch?v={videoId}` for that same top video |
| Top recent video views | `top_video_views` | `integer` | `viewCount` of that top video |

### Group B — Already fetched by channels.ts, just not stored

| Field | Column Name | Type | Source |
|---|---|---|---|
| Channel country | `channel_country` | `text` | `snippet.country` from channels.list — already in `ChannelData` |
| Channel keywords | `channel_keywords` | `text[]` | `brandingSettings.channel.keywords` — already parsed in `ChannelData` as `keywords: string[]` |
| Is verified | `is_verified` | `boolean` | Check `status.isLinked` from channels.list `status` part. Add `status` to the PARTS string in `channels.ts`. Field: `status.isLinked` — true for linked/verified accounts. |

### Group C — Promoted from About page scrape (already scraped, just not in dedicated columns)

| Field | Column Name | Type | Source |
|---|---|---|---|
| TikTok URL | `tiktok` | `text` | `socialLinks` array where `platform === 'tiktok'` — already scraped |
| LinkedIn URL | `linkedin` | `text` | `socialLinks` array where `platform === 'linkedin'` — already scraped |
| Facebook URL | `facebook` | `text` | `socialLinks` array where `platform === 'facebook'` — already scraped |

### Group D — New YouTube API call (activities.list)

| Field | Column Name | Type | How to Fetch |
|---|---|---|---|
| Has community posts | `has_community_posts` | `boolean` | Call `activities.list` with `part=snippet&channelId={channelId}&maxResults=5`. If any item has `snippet.type === 'bulletin'`, set to `true`. Fail gracefully — if the call fails or returns empty, set to `false`. This costs **1 quota unit**. |

### Group E — AI-generated fields (expand the existing AI call — no new API needed)

| Field | Column Name | Type | What the AI should produce |
|---|---|---|---|
| AI red flags | `ai_red_flags` | `text[]` | 2–5 specific, evidence-backed warning signals. Examples: "No uploads in 45 days despite 50k subscribers", "All recent videos are Shorts — may not suit long-form campaigns", "Engagement dropped sharply in last 3 videos". Empty array if no red flags. |
| AI confidence reason | `ai_confidence_reason` | `text` | A single sentence explaining WHY confidence is low/medium/high. Example: "Low confidence because only 3 videos available and no channel description." |
| Outreach email draft | `outreach_email_draft` | `text` | A 4–6 line personalised cold email draft in GROW's voice. Must reference the creator's niche, a specific strength from the data, and one growth gap. Do not invent numbers. Sign off as "The GROW Team". |

---

## 5. Database Migration

Create a new file: `supabase/migrations/0014_enrichment_upgrade.sql`

```sql
-- 0014_enrichment_upgrade.sql
-- Add 15 new enrichment fields to leads table

ALTER TABLE leads
  -- Group A: computed from video data
  ADD COLUMN shorts_pct numeric(5,2) NULL,
  ADD COLUMN avg_like_rate_pct numeric(6,3) NULL,
  ADD COLUMN avg_comment_rate_pct numeric(6,3) NULL,
  ADD COLUMN avg_duration_sec integer NULL,
  ADD COLUMN top_video_title text NULL,
  ADD COLUMN top_video_url text NULL,
  ADD COLUMN top_video_views integer NULL,

  -- Group B: from channels.list (already fetched)
  ADD COLUMN channel_country text NULL,
  ADD COLUMN channel_keywords text[] NULL,
  ADD COLUMN is_verified boolean NULL,

  -- Group C: promoted from socialLinks
  ADD COLUMN tiktok text NULL,
  ADD COLUMN linkedin text NULL,
  ADD COLUMN facebook text NULL,

  -- Group D: community posts
  ADD COLUMN has_community_posts boolean NULL,

  -- Group E: AI-generated
  ADD COLUMN ai_red_flags text[] NULL,
  ADD COLUMN ai_confidence_reason text NULL,
  ADD COLUMN outreach_email_draft text NULL;

COMMENT ON COLUMN leads.shorts_pct IS 'Percentage of recent videos that are YouTube Shorts (duration < 60s)';
COMMENT ON COLUMN leads.avg_like_rate_pct IS 'Average like rate across last 10 videos: likes/views*100';
COMMENT ON COLUMN leads.avg_comment_rate_pct IS 'Average comment rate across last 10 videos: comments/views*100';
COMMENT ON COLUMN leads.avg_duration_sec IS 'Average video duration in seconds across last 10 videos';
COMMENT ON COLUMN leads.top_video_title IS 'Title of the highest-viewed video from recent fetch';
COMMENT ON COLUMN leads.top_video_url IS 'YouTube URL of the highest-viewed video from recent fetch';
COMMENT ON COLUMN leads.top_video_views IS 'View count of the highest-viewed recent video';
COMMENT ON COLUMN leads.channel_country IS 'Creator declared country from YouTube channel data';
COMMENT ON COLUMN leads.channel_keywords IS 'Creator own channel tags from YouTube branding settings';
COMMENT ON COLUMN leads.is_verified IS 'Whether this channel has a verified/linked status on YouTube';
COMMENT ON COLUMN leads.tiktok IS 'TikTok profile URL (scraped from YouTube About page)';
COMMENT ON COLUMN leads.linkedin IS 'LinkedIn profile URL (scraped from YouTube About page)';
COMMENT ON COLUMN leads.facebook IS 'Facebook page URL (scraped from YouTube About page)';
COMMENT ON COLUMN leads.has_community_posts IS 'Whether the channel actively uses YouTube Community posts';
COMMENT ON COLUMN leads.ai_red_flags IS 'AI-detected warning signals with evidence';
COMMENT ON COLUMN leads.ai_confidence_reason IS 'AI explanation of why confidence is low/medium/high';
COMMENT ON COLUMN leads.outreach_email_draft IS 'AI-generated personalised cold email draft for this creator';
```

---

## 6. Backend Changes

### 6a. `lib/youtube/types.ts` — Add new fields to `YouTubeEnrichmentResult`

Add these fields to the `YouTubeEnrichmentResult` interface:

```typescript
// Group A — computed
shortsPct: number | null           // % of recent videos that are Shorts
avgLikeRatePct: number | null      // avg like rate %
avgCommentRatePct: number | null   // avg comment rate %
avgDurationSec: number | null      // avg video duration in seconds
topVideoTitle: string | null       // title of highest-viewed recent video
topVideoUrl: string | null         // URL of highest-viewed recent video
topVideoViews: number | null       // views of highest-viewed recent video

// Group B — already in ChannelData, just pass through
channelCountry: string | null      // snippet.country
channelKeywords: string[]          // brandingSettings keywords

// Group C — promoted from socialLinks
tiktok: string | null
linkedin: string | null
facebook: string | null

// Group D — new API call
hasCommunityPosts: boolean

// Note: is_verified comes from channels.ts changes
isVerified: boolean
```

Also add `isVerified: boolean` to the `ChannelData` interface (fetched from `status.isLinked`).

### 6b. `lib/youtube/channels.ts` — Add `status` part + isVerified

- Add `status` to the `PARTS` constant: `'snippet,statistics,brandingSettings,contentDetails,status'`
- Add `isLinked?: boolean` to the `RawChannelItem.status` type
- In `parseItem`, set `isVerified: item.status?.isLinked ?? false`
- Add `isVerified: boolean` to the returned `ChannelData` object

### 6c. `lib/youtube/orchestrator.ts` — Compute Group A + D, pass through B + C

**In `computeDerived`, add:**

```typescript
// Shorts %
const shortsCount = videos.filter(v => v.durationSec > 0 && v.durationSec < 60).length
const shortsPct = videos.length > 0
  ? Math.round((shortsCount / videos.length) * 1000) / 10
  : null

// Like rate and comment rate — only from non-zero-view videos
const validVideos = top10.filter(v => v.viewCount > 0)
const avgLikeRatePct = validVideos.length > 0
  ? Math.round(
      (validVideos.reduce((sum, v) => sum + (v.likeCount / v.viewCount) * 100, 0) / validVideos.length) * 100
    ) / 100
  : null

const avgCommentRatePct = validVideos.length > 0
  ? Math.round(
      (validVideos.reduce((sum, v) => sum + (v.commentCount / v.viewCount) * 100, 0) / validVideos.length) * 100
    ) / 100
  : null

// Avg duration
const avgDurationSec = top10.length > 0
  ? Math.round(top10.reduce((sum, v) => sum + v.durationSec, 0) / top10.length)
  : null

// Top video
const topVideo = top10.length > 0
  ? top10.reduce((best, v) => v.viewCount > best.viewCount ? v : best)
  : null
const topVideoTitle = topVideo?.title ?? null
const topVideoUrl = topVideo ? `https://youtube.com/watch?v=${topVideo.videoId}` : null
const topVideoViews = topVideo?.viewCount ?? null
```

**Add `fetchCommunityPosts` function in orchestrator** (or a new file `lib/youtube/community.ts`):
```typescript
async function checkCommunityPosts(channelId: string): Promise<boolean> {
  try {
    const url = buildUrl('activities', {
      part: 'snippet',
      channelId,
      maxResults: '5',
    })
    const data = await ytFetch(url) as { items?: Array<{ snippet: { type: string } }> }
    return (data.items ?? []).some(item => item.snippet.type === 'bulletin')
  } catch {
    return false  // always fail gracefully
  }
}
```

**In `fetchAllYouTubeData`, add:**
- Call `checkCommunityPosts(channel.channelId)` (in parallel with other calls if possible)
- Extract `tiktok`, `linkedin`, `facebook` from `about.socialLinks`
- Pass all new fields into the returned object

**Promote from socialLinks:**
```typescript
const tiktok = about.socialLinks.find(l => l.platform === 'tiktok')?.url ?? null
const linkedin = about.socialLinks.find(l => l.platform === 'linkedin')?.url ?? null
const facebook = about.socialLinks.find(l => l.platform === 'facebook')?.url ?? null
```

### 6d. `lib/ai/types.ts` — Add 3 new AI fields to `ChannelAnalysis`

```typescript
ai_red_flags: string[]
ai_confidence_reason: string
outreach_email_draft: string
```

### 6e. `lib/ai/systemPrompt.ts` — Expand the AI prompt

Replace the current system prompt with an expanded version that instructs the AI to also return:
- `ai_red_flags`: Array of 2–5 warning signals, each grounded in specific data. Empty array `[]` if no red flags.
- `ai_confidence_reason`: One sentence explaining why confidence is low/medium/high.
- `outreach_email_draft`: A 4–6 line personalised cold email. Must reference the creator's niche, a specific data-backed strength, and one growth opportunity GROW could help with. Sign off: "The GROW Team". Do not invent numbers.

The JSON schema the AI must return now has **12 fields** (the original 9 + the 3 new ones). Update the schema comment in the system prompt accordingly.

**Critical rule to add:** "For `ai_red_flags`, only list real, evidence-backed issues visible in the data. If you detect no red flags, return an empty array — do not invent concerns."

### 6f. `lib/ai/promptBuilder.ts` — Feed more data to the AI

Add to the user prompt:
- Channel country (if available)
- Channel keywords (if available, first 10)
- Shorts % (if computed)
- Avg like rate and comment rate
- Avg video duration
- A note if the channel has community posts

Example addition to the prompt string:
```
## Extended channel data
- Country: ${data.channelCountry ?? 'Not specified'}
- Channel keywords: ${data.channelKeywords.slice(0, 10).join(', ') || 'None'}
- Shorts percentage: ${data.shortsPct !== null ? data.shortsPct + '%' : 'Unknown'}
- Avg like rate (last 10): ${data.avgLikeRatePct !== null ? data.avgLikeRatePct + '%' : 'Unknown'}
- Avg comment rate (last 10): ${data.avgCommentRatePct !== null ? data.avgCommentRatePct + '%' : 'Unknown'}
- Avg video duration (last 10): ${data.avgDurationSec !== null ? Math.floor(data.avgDurationSec / 60) + 'm ' + (data.avgDurationSec % 60) + 's' : 'Unknown'}
- Community posts active: ${data.hasCommunityPosts ? 'Yes' : 'No'}
- Top recent video: "${data.topVideoTitle ?? 'N/A'}" — ${data.topVideoViews?.toLocaleString() ?? 'N/A'} views
```

### 6g. `lib/ai/analyzer.ts` — Update `validateAnalysis` to handle new fields

Add validation for the 3 new fields:
```typescript
ai_red_flags: toStringArray(r.ai_red_flags),
ai_confidence_reason: typeof r.ai_confidence_reason === 'string' ? r.ai_confidence_reason : '',
outreach_email_draft: typeof r.outreach_email_draft === 'string' ? r.outreach_email_draft : '',
```

### 6h. `app/api/enrich/route.ts` — Save all new fields to Supabase

In the `.insert({...})` call, add all 15 new columns mapped from the data:

```typescript
// From YouTube data
shorts_pct: ytData.shortsPct,
avg_like_rate_pct: ytData.avgLikeRatePct,
avg_comment_rate_pct: ytData.avgCommentRatePct,
avg_duration_sec: ytData.avgDurationSec,
top_video_title: ytData.topVideoTitle,
top_video_url: ytData.topVideoUrl,
top_video_views: ytData.topVideoViews,
channel_country: ytData.channelCountry,
channel_keywords: ytData.channelKeywords,
is_verified: ytData.isVerified,
tiktok: ytData.tiktok,
linkedin: ytData.linkedin,
facebook: ytData.facebook,
has_community_posts: ytData.hasCommunityPosts,

// From AI analysis
ai_red_flags: analysis.ai_red_flags,
ai_confidence_reason: analysis.ai_confidence_reason,
outreach_email_draft: analysis.outreach_email_draft,
```

Also update `logAPIUsage` — the `apiName` for Groq should remain `'groq'` since we haven't switched yet.

### 6i. `app/api/re-enrich/route.ts` — Mirror the same fields in the update call

Find the `.update({...})` call and add the same 15 new columns as above so re-enrichment also refreshes them.

---

## 7. Frontend UI Changes

The lead review screen is at `app/(authenticated)/leads/[id]/review/`. The edit screen is at `app/(authenticated)/leads/[id]/edit/`.

### Design rules (MUST follow)
- Use the existing Tailwind design system already in use on those pages — match the exact same card/panel/badge styles that are currently there
- Do not introduce new UI libraries or custom CSS files
- Group related new fields into labelled sections/cards — do not scatter them randomly
- Every new metric should have a label, value, and optionally a context hint (e.g. "2%+ is strong engagement")
- Use coloured badges for thresholds (e.g. shorts_pct > 70% = amber warning badge, like_rate > 2% = green, < 0.5% = amber)
- The outreach email draft should be in a distinct box with a "Copy to clipboard" button
- AI red flags should render as a red-bordered list, each item with a ⚠️ icon. If the array is empty, show a small "No red flags detected" with a ✅ icon
- Channel keywords should render as small pill/badge tags, not a plain text list

### New sections to add on the review screen

#### Section: "Engagement Breakdown"
Display alongside or below the existing YouTube stats panel:

| Label | Value | Threshold hint |
|---|---|---|
| Avg Like Rate | `{avg_like_rate_pct}%` | < 0.5% = amber, ≥ 2% = green |
| Avg Comment Rate | `{avg_comment_rate_pct}%` | < 0.05% = amber, ≥ 0.2% = green |
| Shorts Content | `{shorts_pct}%` of recent videos | > 70% = amber badge "Mostly Shorts" |
| Avg Video Duration | Formatted as `Xm Ys` | < 3 min = badge "Short-form", ≥ 15 min = badge "Long-form" |

#### Section: "Top Recent Video"
Small card with:
- Video title (clickable link to `top_video_url`)
- View count formatted with commas
- Label: "Best performing video from last 15 uploads"

#### Section: "Channel Profile"
Display near the existing channel info:

| Label | Value |
|---|---|
| Country | Flag emoji + country name (or "Not specified") |
| Verified | ✅ Verified or — Not verified |
| Community Posts | ✅ Active or — Not detected |
| Keywords | Pill badges, max 10 shown |

#### Section: "Social Links" (expand existing)
Promote TikTok, LinkedIn, Facebook to named rows alongside existing Instagram/Twitter.

#### Section: "AI Red Flags" (new card, placed prominently near the concerns panel)
- Red-bordered card with header "⚠️ Red Flags"
- Each item as a bullet with ⚠️ icon
- If empty: "✅ No red flags detected" in green

#### Section: "AI Confidence"
Expand the existing confidence badge to also show `ai_confidence_reason` as a subtitle text below the badge.

#### Section: "Outreach Email Draft" (new card, placed at the bottom of the review screen)
- Distinct card with header "📧 Outreach Email Draft"
- Subtitle: "AI-generated first draft — edit before sending"
- The email in a `<pre>` or styled text block with soft background
- "Copy to clipboard" button (use `navigator.clipboard.writeText`)
- If `outreach_email_draft` is empty/null, show "Not generated — re-enrich this lead to generate"

---

## 8. Data Fetch Quota Impact

Document this so nothing surprises you:

| New call | Quota units | Notes |
|---|---|---|
| `channels.list` with `status` part added | 0 extra (same call, just more parts) | No quota change |
| `activities.list` for community posts | +1 unit per enrichment | Always fails gracefully |
| All other new fields | 0 extra | Computed from existing fetched data |

**Total quota cost per enrichment:** was 3 units → now 4 units. Well within the 10,000/day limit.

---

## 9. Important Constraints

1. **Do not break existing enrichment** — all existing fields must continue to work exactly as before. New fields are purely additive.
2. **All new fields are nullable** — if a fetch fails or data is missing, store `null` and display gracefully ("Not available" or "—")
3. **Fail gracefully everywhere** — `has_community_posts` and `is_verified` must never throw — wrap in try/catch
4. **Do not change the scoring formula** — the 4-factor lead score (`yt_score_factor`, `sub_range_factor`, `s2v_factor`, `g_factor_normalized`) is pure math and must not be touched
5. **Do not change the Supabase auth or RLS setup** — only add columns to `leads` table
6. **Do not change `lib/sheets/`** — Google Sheets sync does not need to be updated for this task
7. **Keep the AI provider as Groq** — do not change `AI_PROVIDER` or the Groq client
8. **Run `npm run build` at the end** to verify no TypeScript errors before finishing

---

## 10. Execution Order

Work in this exact order to avoid type errors:

1. Create `supabase/migrations/0014_enrichment_upgrade.sql`
2. Update `lib/youtube/types.ts` (add new fields to both interfaces)
3. Update `lib/youtube/channels.ts` (add `status` part + `isVerified`)
4. Update `lib/youtube/orchestrator.ts` (compute Group A, add Group B/C/D, assemble new fields)
5. Update `lib/ai/types.ts` (add 3 new AI fields)
6. Update `lib/ai/systemPrompt.ts` (expand AI instructions and JSON schema)
7. Update `lib/ai/promptBuilder.ts` (feed new data to AI)
8. Update `lib/ai/analyzer.ts` (validate 3 new AI fields)
9. Update `app/api/enrich/route.ts` (save all 15 new fields to Supabase)
10. Update `app/api/re-enrich/route.ts` (mirror same fields in update)
11. Update review screen UI (`app/(authenticated)/leads/[id]/review/`)
12. Update edit screen UI (`app/(authenticated)/leads/[id]/edit/`) if any new fields are editable (only `outreach_email_draft` should be editable — add it as a textarea)
13. Run `npm run build` and fix any type errors

---

## 11. Acceptance Criteria

When done, the following must be true:

- [ ] Enriching a new lead fetches and stores all 15 new fields
- [ ] Re-enriching an existing lead updates all 15 new fields
- [ ] The review screen displays all new sections cleanly with no layout breakage
- [ ] Null/missing values display as "—" or "Not available" — no blank holes or `undefined` text
- [ ] Red flags render as a red-bordered list or show "No red flags detected" in green
- [ ] Outreach email draft has a working copy-to-clipboard button
- [ ] Channel keywords render as pill badges
- [ ] Like/comment rates and shorts % show coloured threshold indicators
- [ ] `npm run build` passes with zero TypeScript errors
