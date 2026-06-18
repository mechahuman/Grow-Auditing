# Database & Enrichment Reference

> A complete reference for every database table, every column, how each is used in the app, and a full breakdown of what is fetched when a lead is enriched — plus suggestions for future data additions.

---

## Part 1 — Database Tables

---

### 1. `leads`
> The core table. Every enriched creator is stored here as a single row.

**Added across migrations:** `0001`, `0004`, `0005`, `0006`, `0007`, `0012`

#### Human Input (filled by employee on the enrich form)

| Column | Type | Description | Used Where |
|---|---|---|---|
| `lead_name` | text | Creator's display name (e.g. "Ryan Tolmia") | Leads list, review screen header, Google Sheet |
| `found_by` | text | Initials of team member who found this lead | Leads list filter "Mine", Google Sheet |
| `g_factor` | int (1–5) | Employee's gut instinct score | Lead score calculation, review screen |
| `youtube_url` | text | The original URL the employee pasted | Review screen, dedup check |
| `email` | text | Contact email — either found by scraper or typed manually | Review screen (editable), Google Sheet |
| `website` | text | Creator's website — scraped or typed manually | Review screen (editable), Google Sheet |

#### YouTube API Fetched Data

| Column | Type | Description | Used Where |
|---|---|---|---|
| `youtube_handle` | text | Channel handle e.g. `@RyanTolmia` | Review screen, leads list |
| `youtube_channel_id` | text | Unique YouTube channel ID (UC...) | Dedup index, re-enrichment |
| `subscriber_count` | int | Total subscribers at time of enrichment | Lead scoring (sub range factor), review screen |
| `total_views` | bigint | Lifetime total channel views | Review screen stats panel |
| `video_count` | int | Total videos published on the channel | Review screen stats panel |
| `channel_created_at` | timestamptz | Date the YouTube channel was created | Review screen (channel age indicator) |
| `last_upload_at` | timestamptz | Date of most recent video upload | Review screen, red flag detection |
| `avg_views_last_10` | int | Average views across the last 10 videos | Lead scoring (S2V factor), review screen |
| `s2v_ratio_pct` | numeric | Subscriber-to-view ratio as % (avg views ÷ subs × 100) | Lead scoring, review screen |
| `posting_frequency_30d` | numeric | Number of videos posted in the last 30 days | Review screen posting stats |
| `channel_thumbnail_url` | text | URL to the channel's profile picture | Leads list avatar, review screen header |
| `instagram` | text | Instagram URL (from About page scrape or manual entry) | Review screen (editable), Google Sheet |
| `twitter` | text | Twitter/X URL (from About page scrape or manual entry) | Review screen (editable), Google Sheet |

#### AI-Generated Fields (written by AI, editable by employee)

| Column | Type | Description | Used Where |
|---|---|---|---|
| `category` | text | Niche label e.g. "ADHD productivity creator" | Review screen, leads list tag, Google Sheet |
| `content_style` | text | How they make content e.g. "Talking-head tutorials" | Review screen, Google Sheet |
| `posting_pattern` | text | AI description of posting cadence | Review screen |
| `monetization` | text | What the creator appears to sell | Review screen, Google Sheet |
| `strengths` | text[] | Array of 2–4 evidence-backed positive observations | Review screen strengths panel |
| `concerns` | text[] | Array of 2–4 evidence-backed concern observations | Review screen concerns panel |
| `data_gaps` | text[] | Things the AI could not determine | Review screen data gaps panel |
| `remarks_ai_draft` | text | AI's original remarks paragraph (preserved for audit) | "Show original draft" toggle on review screen |
| `remarks_final` | text | Employee-edited version of the remarks | Google Sheet, lead detail view |
| `ai_confidence` | text | `low` / `medium` / `high` — how much data was available | Review screen confidence badge |

#### Lead Scoring (computed by pure math, no AI)

| Column | Type | Description | Used Where |
|---|---|---|---|
| `yt_score_factor` | numeric | Always 1.0 (channel has YouTube) | Score breakdown panel |
| `sub_range_factor` | numeric | 0, 0.5, or 1.0 based on subscriber tier | Score breakdown panel |
| `s2v_factor` | numeric | 0 or 1.0 based on S2V ratio ≥ 10% | Score breakdown panel |
| `g_factor_normalized` | numeric | G-Factor mapped to 0–1 scale | Score breakdown panel |
| `lead_score_total` | numeric | Final score: 1 + (all four factors) | Leads list badge, review screen header |

#### Workflow State

| Column | Type | Description | Used Where |
|---|---|---|---|
| `status` | text | `new` / `mail_sent` / `replied` / `call_booked` / `closed` | Leads list status badge, filter dropdown |
| `status_notes` | text | Optional free-text note on the current status | Review screen (editable) |
| `draft` | boolean | `true` until employee confirms save on review screen | Drafts are hidden from the main leads list |
| `deleted_at` | timestamptz | Null = active. Set = soft-deleted (archived) | Archived leads filter |
| `user_id` | uuid | Supabase auth user ID of who enriched this lead | RLS policy (members see only own leads) |
| `enriched_by` | text | Email of the user who ran the enrichment | Review screen audit info |

#### Re-Enrichment Tracking

| Column | Type | Description | Used Where |
|---|---|---|---|
| `re_enrich_count` | int | How many times this lead has been re-enriched | Review screen (re-enrich history) |
| `re_enriched_at` | timestamptz | Timestamp of the most recent re-enrichment | Review screen |

#### Google Sheets Sync

| Column | Type | Description | Used Where |
|---|---|---|---|
| `sheets_synced` | boolean | Whether this lead has been written to the Sheet | Cron job retry logic |
| `sheets_sync_attempts` | int | Number of sync attempts (max 3 before giving up) | Cron job retry logic |
| `sheets_sync_last_attempted_at` | timestamptz | When the last sync attempt happened | Admin monitoring |
| `google_sheet_row_ref` | text | Row reference in Sheet e.g. "Leads!A57" | Link back to Sheet row |

#### Raw Audit Data

| Column | Type | Description | Used Where |
|---|---|---|---|
| `raw_youtube_data` | jsonb | Full YouTube API response (channel + recent videos) | Debugging, future AI memory layer |
| `raw_ai_response` | jsonb | Full AI response including any partial/error state | Debugging, AI confidence audit |

#### Timestamps

| Column | Type | Description |
|---|---|---|
| `created_at` | timestamptz | When the lead was first enriched |
| `updated_at` | timestamptz | Auto-updated on every row change (trigger) |

---

### 2. `team_members`
> Stores every GROW team member. Also acts as the login whitelist — only emails in this table can sign in.

**Added across migrations:** `0001`, `0007`

| Column | Type | Description | Used Where |
|---|---|---|---|
| `id` | uuid | Internal primary key | Foreign keys |
| `user_id` | uuid | Linked Supabase auth user ID (set on first login) | RLS policies, role checks |
| `initials` | text | Team member's initials e.g. "MK" | "Found By" dropdown on enrich form |
| `full_name` | text | Full display name | Admin panel |
| `email` | text | Login email — must match auth.users email | Whitelist gate, auto-link trigger |
| `role` | text | `admin` or `member` | RLS policies, admin-only features |
| `active` | boolean | If false, blocks login even if email exists | Admin deactivation |
| `created_at` | timestamptz | When the member was added | Admin panel |

**Key behaviour:** A database trigger (`handle_auth_user_signup`) fires when someone signs up. If their email is in `team_members`, it links their `user_id`. If not, they're blocked by middleware and redirected to `/unauthorized`.

---

### 3. `status_options`
> A lookup table that defines the allowed status values shown in the status dropdown on the review screen.

**Added in:** `0001`, seeded in `0002`

| Column | Type | Description | Used Where |
|---|---|---|---|
| `id` | uuid | Primary key | Internal |
| `value` | text | Machine value e.g. `mail_sent` | Stored in `leads.status` |
| `label` | text | Display label e.g. "Mail Sent" | Status dropdown, leads list badge |
| `color` | text | Hex or CSS color for the badge | Status badge color |
| `sort_order` | int | Controls dropdown order | Dropdown rendering |

---

### 4. `lead_admin_notes`
> Internal notes that admins can leave on any lead. Visible to all team members, writable only by admins.

**Added in:** `0008`

| Column | Type | Description | Used Where |
|---|---|---|---|
| `id` | uuid | Primary key | Internal |
| `lead_id` | uuid | Which lead this note belongs to | Cascades on lead delete |
| `admin_id` | uuid | Which admin wrote this note | RLS policy, note attribution |
| `content` | text | The note text | Lead detail notes panel |
| `created_at` | timestamptz | When the note was written | Notes panel timestamp |
| `updated_at` | timestamptz | Auto-updated on edit | Notes panel |

---

### 5. `lead_reassignment_audit`
> An immutable audit trail. Every time a lead is assigned or reassigned to a different team member, a row is written here. Never deleted.

**Added in:** `0011`

| Column | Type | Description | Used Where |
|---|---|---|---|
| `id` | uuid | Primary key | Internal |
| `lead_id` | uuid | Which lead was reassigned | Admin lead history |
| `previous_assignee_id` | uuid | Who had the lead before | Admin audit view |
| `new_assignee_id` | uuid | Who got the lead | Admin audit view |
| `changed_by_id` | uuid | Which admin made the change | Admin audit view |
| `action` | text | `Created` / `Reassigned` / `Unassigned` | Admin audit view |
| `notes` | text | Optional reason for reassignment | Admin audit view |
| `created_at` | timestamptz | When the change happened | Admin audit view |

---

### 6. `api_keys`
> Metadata for every external API the system uses. One row per API. Stores quota limits and cost-per-call for monitoring.

**Added in:** `0013`

| Column | Type | Description | Used Where |
|---|---|---|---|
| `id` | uuid | Primary key | Referenced by `api_usage_logs` |
| `api_name` | text | `youtube` / `groq` / `google_sheets` / `supabase` | Usage tracker lookup |
| `service_type` | text | `enrichment` / `ai_analysis` / `data_export` / `database` | Admin API dashboard |
| `display_name` | text | Human-readable name e.g. "YouTube Data API" | Admin API dashboard |
| `max_quota_daily` | int | Daily quota cap (e.g. 10,000 for YouTube) | Admin quota warning |
| `max_quota_monthly` | int | Monthly quota cap | Admin quota warning |
| `quota_reset_type` | text | `daily` or `monthly` | Admin dashboard |
| `quota_reset_date` | date | Next reset date | Admin dashboard |
| `status` | text | `active` / `inactive` / `error` | Admin dashboard |
| `cost_per_unit` | decimal | Cost per API call in USD | Admin cost tracking |
| `cost_currency` | text | Currency (default `USD`) | Admin cost tracking |
| `created_at` / `updated_at` | timestamp | Record timestamps | Internal |

---

### 7. `api_usage_logs`
> One row written for every API call made by the system — successes and failures alike. Used for quota monitoring and cost tracking.

**Added in:** `0013`

| Column | Type | Description | Used Where |
|---|---|---|---|
| `id` | uuid | Primary key | Internal |
| `api_key_id` | uuid | Which API this call belongs to | Joined with `api_keys` for dashboard |
| `user_id` | uuid | Which team member triggered this call | Per-user usage breakdown |
| `endpoint` | text | Which endpoint was called e.g. `channels.list` | Admin API log |
| `status` | text | `success` or `error` | Admin dashboard, error rate |
| `error_message` | text | Error detail if call failed | Admin debugging |
| `quota_units_used` | int | Units consumed by this call | Quota tracking |
| `response_time_ms` | int | How long the call took in milliseconds | Performance monitoring |
| `cost_cents` | int | Cost of this call in cents | Cost tracking |
| `created_at` | timestamp | When the call happened | Time-series chart |

---

---

## Part 2 — What Is Fetched When Enriching a Lead

When an employee clicks **Enrich Lead**, the system makes 3 types of calls in sequence.

---

### Step 1 — YouTube Data API v3 (Official API)

The system calls the YouTube Data API with the channel URL and pulls the following:

#### From `channels.list` (parts: snippet, statistics, brandingSettings, contentDetails)

| Data Point | What It Is | Stored As |
|---|---|---|
| Channel ID | Unique `UC...` identifier | `youtube_channel_id` |
| Handle | `@channelname` | `youtube_handle` |
| Channel title | Display name | (used for `lead_name` fallback) |
| Description | Full channel bio | Sent to AI for analysis |
| Published date | When the channel was created | `channel_created_at` |
| Subscriber count | Total subscribers | `subscriber_count` |
| Total view count | Lifetime channel views | `total_views` |
| Video count | Total published videos | `video_count` |
| Thumbnail URL | Profile picture (high res preferred) | `channel_thumbnail_url` |
| Channel keywords | Tags set by the creator in branding settings | Sent to AI for analysis |
| Country | Creator's declared country | Sent to AI for analysis |
| Uploads playlist ID | Internal ID used to fetch video list efficiently | Used in next API call |

#### From `playlistItems.list` (1 quota unit)

Fetches the IDs of the last 15 uploaded videos using the uploads playlist ID. These IDs are then used to fetch video stats.

#### From `videos.list` (parts: snippet, statistics, contentDetails) — 1 quota unit for up to 50 videos

| Data Point | What It Is | Stored As |
|---|---|---|
| Video ID | YouTube video ID | In `raw_youtube_data` |
| Title | Video title | Sent to AI, in `raw_youtube_data` |
| Published date | When each video was published | Used to compute `last_upload_at`, `posting_frequency_30d` |
| View count | Views per video | Used to compute `avg_views_last_10` |
| Like count | Likes per video | In `raw_youtube_data` |
| Comment count | Comments per video | In `raw_youtube_data` |
| Duration | Video length in seconds (parsed from ISO 8601) | In `raw_youtube_data` |
| Description snippet | First 200 characters of video description | Sent to AI |

#### Computed from the above (no extra API calls)

| Computed Field | How It's Computed | Stored As |
|---|---|---|
| Last upload date | Most recent video's publish date | `last_upload_at` |
| Avg views (last 10) | Sum of top 10 video views ÷ 10 | `avg_views_last_10` |
| S2V ratio % | Avg views ÷ subscribers × 100 | `s2v_ratio_pct` |
| Posting frequency (30d) | Count of videos published in last 30 days | `posting_frequency_30d` |

---

### Step 2 — YouTube About Page Scrape (No API key required)

The system visits `youtube.com/@handle/about` and parses the page HTML to extract:

| Data Point | What It Is | Stored As |
|---|---|---|
| Business email | `businessEmail` field from YouTube's embedded page data | `email` |
| Primary website | First non-social external link found in the about links | `website` |
| Instagram URL | Detected from instagram.com links | `instagram` |
| Twitter/X URL | Detected from twitter.com or x.com links | `twitter` |
| TikTok, Facebook, LinkedIn, Twitch | Also detected (stored in `raw_youtube_data.socialLinks`) | Social links array |

> This step **always fails gracefully** — if YouTube blocks the scrape or the page has no data, enrichment continues normally with these fields left blank.

---

### Step 3 — AI Analysis (Groq / Claude)

The system sends all of the above data to the AI and receives back:

| Field | What the AI Produces |
|---|---|
| `category` | Niche label e.g. "B2B SaaS content creator" |
| `content_style` | Format description e.g. "Talking-head tutorials, casual production" |
| `posting_pattern` | Cadence description e.g. "Weekly, consistent" |
| `monetization` | What they appear to sell, or "Not visible" |
| `strengths` | 2–4 evidence-backed positive observations |
| `concerns` | 2–4 evidence-backed concern observations |
| `remarks_ai_draft` | 2–4 sentence paragraph — editable by employee |
| `ai_confidence` | `low` / `medium` / `high` based on data availability |
| `data_gaps` | List of things the AI couldn't determine |

---

---

## Part 3 — Suggested Additional Data to Fetch on Lead Enrichment

These are things the YouTube Data API already provides (or can provide with minor additions) that are not currently being stored — and would make the lead profile significantly richer.

---

### Additional YouTube API Data (Already Available, Just Not Stored)

| Data Point | Source | Why It's Valuable |
|---|---|---|
| **Shorts vs Long-form breakdown** | Analyse video duration from existing fetch | Creators doing only Shorts may not suit long-form campaigns. Currently invisible. |
| **Like rate per video** | `likeCount ÷ viewCount` — already fetched | Measures how much the audience approves of content. A 2%+ like rate is strong engagement. |
| **Comment rate per video** | `commentCount ÷ viewCount` — already fetched | Community engagement signal. High comment rate = active, loyal audience. |
| **Avg video duration (last 10)** | `durationSec` already fetched | Short videos (under 3 min) vs long-form (15+ min) signals content depth and ad-friendliness. |
| **Channel keywords** | Already fetched via `brandingSettings` | Niche confirmation — creator's own tags. Currently sent to AI but not stored as a separate field. |
| **Channel country** | Already fetched via `snippet.country` | Useful for geographic targeting. Currently sent to AI but not stored. |
| **Highest-viewed recent video** | Max viewCount from existing video fetch | Quickly surfaces the creator's breakout content — useful for outreach personalisation. |
| **TikTok / LinkedIn / Facebook links** | Already scraped — currently in socialLinks array | Stored in raw data but no dedicated columns. Could be promoted to named columns. |

---

### New Data Points Worth Adding (Require Additional Effort)

| Data Point | How to Get It | Why It's Valuable |
|---|---|---|
| **Channel verification status** | Check for `verified` badge in channel snippet | Verified channels carry more credibility. Simple boolean flag. |
| **Community posts activity** | YouTube API `activities.list` endpoint | Creators who actively use Community posts have higher audience engagement beyond videos. |
| **Channel trailer video** | `brandingSettings.channel.unsubscribedTrailer` — already in API response | The trailer is the creator's elevator pitch. Sending it to AI would dramatically improve category/style classification. |
| **Membership / channel join enabled** | Available in channel snippet | Signals a monetised, committed creator community — higher LTV potential. |
| **Top 3 best-performing videos ever** | `search.list` with `order=viewCount` (costs 100 quota units) | The creator's viral content reveals what actually works for them — gold for outreach. |
| **Outreach email draft** | Generated by Claude after enrichment (no new API needed) | One-click personalised cold email using all enriched data. See Claude Migration Plan. |
| **AI red flags list** | Generated by Claude during analysis (no new API needed) | Explicit list of warning signals — inactive channel, Shorts-only, declining engagement. |
| **AI confidence explanation** | Generated by Claude during analysis (no new API needed) | Instead of just "Low", explains exactly what data was missing and why. |

---

### Suggested New Database Columns (for the above additions)

If the above are implemented, these columns would be added to the `leads` table:

| Column | Type | Stores |
|---|---|---|
| `shorts_pct` | numeric | % of recent videos that are Shorts (under 60 sec) |
| `avg_like_rate_pct` | numeric | Avg likes ÷ views across last 10 videos as % |
| `avg_comment_rate_pct` | numeric | Avg comments ÷ views across last 10 videos as % |
| `avg_duration_sec` | int | Average video duration across last 10 videos |
| `channel_country` | text | Creator's declared country from YouTube |
| `channel_keywords` | text[] | Creator's own channel tags |
| `tiktok` | text | TikTok profile URL |
| `linkedin` | text | LinkedIn profile URL |
| `is_verified` | boolean | Whether the channel has YouTube verification |
| `has_memberships` | boolean | Whether channel join / memberships are enabled |
| `top_video_url` | text | URL of the creator's highest-viewed recent video |
| `top_video_views` | int | View count of that top video |
| `ai_red_flags` | text[] | AI-detected warning signals (with Claude) |
| `ai_confidence_reason` | text | Claude's explanation of why confidence is Low/Medium/High |
| `outreach_email_draft` | text | Claude-generated cold email draft for this creator |

---

*Last updated: 2026-06-17*
