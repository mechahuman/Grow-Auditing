# 04 — YouTube Data Pipeline

What the system fetches from YouTube, in what order, and how.

---

## Two data sources

### A. YouTube Data API v3 (official, authenticated)

Used for: structured channel data, video lists, video statistics.

- **API key auth** (not OAuth — we don't need user permissions, just public data)
- **Quota:** 10,000 units/day on the free tier
- **Typical enrichment cost:** ~5–8 quota units per lead
- **Headroom:** can process 1,000+ leads/day on free tier

Register a project in Google Cloud Console, enable YouTube Data API v3, generate an API key. Restrict the key to the YouTube Data API. Store in `YOUTUBE_API_KEY`.

### B. Direct HTTP scrape of channel About page

Used for: business email, website link, social links.

- No headless browser needed; YouTube's `/about` page server-renders enough of this
- Simple `fetch()` + HTML parsing with `cheerio`
- Backup: if scraping fails (e.g., YouTube changes layout), the rest of the enrichment still succeeds — these fields just stay blank

---

## Step-by-step pipeline

### Step 1: Parse the YouTube URL

Input formats to support:
- `https://www.youtube.com/@RyanTolmia`
- `https://youtube.com/@RyanTolmia`
- `https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx`
- `https://www.youtube.com/c/RyanTolmia` (legacy)
- `https://www.youtube.com/user/RyanTolmia` (legacy)

Extract either:
- A handle (e.g., `@RyanTolmia` or `RyanTolmia`), OR
- A channel ID (e.g., `UCxxx...`)

If the URL doesn't match any known format → return 400 with error "Unrecognized YouTube URL format."

### Step 2: Resolve to a channel ID

YouTube Data API needs a channel ID for most calls.

- If we already have a channel ID from the URL → skip this step
- If we have a handle → call `channels.list?forHandle=@RyanTolmia&part=id`
- If legacy format → call `search.list?q=USERNAME&type=channel` and take top result

Store the resolved channel ID in `youtube_channel_id`.

### Step 3: Fetch channel data

```
GET https://www.googleapis.com/youtube/v3/channels
?part=snippet,statistics,brandingSettings
&id={channelId}
&key={apiKey}
```

Extract:
- `snippet.title` → for display
- `snippet.description` → channel bio (for AI analysis)
- `snippet.publishedAt` → `channel_created_at`
- `snippet.customUrl` → preferred display URL
- `snippet.country` → optional context
- `statistics.subscriberCount` → `subscriber_count` (note: returns as string, parse to int)
- `statistics.viewCount` → `total_views`
- `statistics.videoCount` → `video_count`
- `brandingSettings.channel.keywords` → useful for AI context
- `brandingSettings.image.bannerExternalUrl` → optional

**Quota cost:** 1 unit.

### Step 4: Fetch recent video IDs

```
GET https://www.googleapis.com/youtube/v3/search
?part=id
&channelId={channelId}
&order=date
&type=video
&maxResults=15
&key={apiKey}
```

Take the 15 most recent video IDs. We'll fetch stats for the top 10–15 in the next call.

**Quota cost:** 100 units. ⚠️ This is the expensive one.

> **Cost-saving alternative:** Use `playlistItems.list` against the channel's uploads playlist (ID is in channel data: `contentDetails.relatedPlaylists.uploads`). Costs 1 unit instead of 100. Implement this version.

```
GET https://www.googleapis.com/youtube/v3/playlistItems
?part=snippet,contentDetails
&playlistId={uploadsPlaylistId}
&maxResults=15
&key={apiKey}
```

**Quota cost:** 1 unit. Use this instead.

To get the uploads playlist ID, modify Step 3 to also request `part=contentDetails`:

```
part=snippet,statistics,brandingSettings,contentDetails
```

### Step 5: Fetch video statistics

```
GET https://www.googleapis.com/youtube/v3/videos
?part=snippet,statistics,contentDetails
&id={comma-separated video IDs}
&key={apiKey}
```

Batch up to 50 IDs in one call. Extract per video:
- `snippet.title`
- `snippet.publishedAt`
- `snippet.description` (first 200 chars is enough for AI)
- `statistics.viewCount`
- `statistics.likeCount`
- `statistics.commentCount`
- `contentDetails.duration` (ISO 8601 format; parse to seconds)

**Quota cost:** 1 unit per call (one call for up to 50 videos).

### Step 6: Compute derived fields

From the data fetched:

```typescript
avg_views_last_10 = average of viewCount across the 10 most recent videos
last_upload_at = max publishedAt across videos
s2v_ratio_pct = (avg_views_last_10 / subscriber_count) * 100
posting_frequency = (number of videos in last 90 days) / 90 (videos per day)
```

### Step 7: Scrape the About page

```
GET https://www.youtube.com/@{handle}/about
```

Headers:
```
User-Agent: Mozilla/5.0 (compatible; LeadIntelBot/1.0)
Accept-Language: en-US,en;q=0.9
```

Parse the HTML with `cheerio`. Look for:

**Business email:**
Embedded in the page's `ytInitialData` JSON blob (search for `"businessEmail"` or similar keys). Sometimes shown as plaintext after a "view email address" click (which we can't simulate without OAuth). In v1, only extract emails visible in the static HTML.

**External links:**
The About page lists external links (website, Twitter, Instagram, etc.) in a `links` section. Extract all URLs and categorize:
- First non-social URL → likely the website
- Twitter, Instagram, TikTok URLs → store for future (when we expand beyond YouTube)

**Country, joined date, total views:** Already have these from the API, ignore.

**Fallback:** If scraping fails (status != 200, parsing fails), continue without error. Just leave `email` and `website` blank.

### Step 8: Return assembled data

Return a single object to the orchestrator:

```typescript
{
  channelId: string;
  handle: string;
  title: string;                       // channel title
  description: string;                 // channel bio
  channelCreatedAt: Date;
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
  lastUploadAt: Date | null;
  avgViewsLast10: number | null;
  s2vRatioPct: number | null;
  recentVideos: Array<{
    title: string;
    publishedAt: Date;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    durationSec: number;
    descriptionSnippet: string;
  }>;
  email: string | null;
  website: string | null;
  socialLinks: Array<{ platform: string; url: string }>;
  rawApiResponses: object;             // for debugging, stored in raw_youtube_data
}
```

---

## Error handling

| Situation | Behavior |
|---|---|
| Invalid URL | Return 400 to client immediately |
| Channel not found | Return 404 with friendly message |
| Channel is private/terminated | Return 200 with partial data and `enrichment_partial=true` flag |
| API quota exceeded | Return 503 with "YouTube quota exceeded, try again tomorrow" |
| API key invalid | Return 500 (server config issue), log loudly |
| About page scrape fails | Continue silently, leave email/website blank |
| Network timeout | Retry once with exponential backoff. Then fail. |

---

## Rate limits and politeness

- YouTube API has per-second rate limits but they're generous for our scale
- For the About page scrape, add a small delay (200–500ms) so we don't look like an abusive bot
- Cache resolved channel IDs in Supabase indefinitely (handles can change, channel IDs cannot) — already covered by `youtube_channel_id` column

---

## Implementation structure

```
/lib/youtube/
  parseUrl.ts            # URL parsing utility
  client.ts              # YouTube Data API client (thin wrapper around fetch)
  channels.ts            # fetchChannelData()
  videos.ts              # fetchRecentVideos(), fetchVideoStats()
  aboutScraper.ts        # scrapeAboutPage()
  orchestrator.ts        # fetchAllYouTubeData() — does steps 1–8
  types.ts               # all return types
  index.ts               # public API
```

Each module is independently testable. Use mocked API responses for unit tests (commit a few real response samples to `__fixtures__/`).

---

## Testing the pipeline

Before integrating with the AI layer, manually test the YouTube pipeline against the leads from Manav's existing sheet:

1. Ryan Tolmia — `https://www.youtube.com/@RyanTolmia`
2. Raymond Nwachukwu — `https://www.youtube.com/@ChigozieNwachukwu`
3. Darren Hinde — `https://www.youtube.com/@DarrenBuildsAI`
4. Go9X — `https://www.youtube.com/@go9x`
5. Michael Charles — `https://www.youtube.com/@creditwithmike`
6. Robert Gaines — `https://www.youtube.com/@FreeTimeMastermind`
7. Tyler Bossetti — `https://www.youtube.com/@allfornothingpodcast`

For each, verify:
- Subscriber count matches the sheet's value (allowing for growth since sheet entry)
- Last upload date is recent enough
- avg_views_last_10 is computable
- Email scrape attempt completes (success or graceful skip)

This is the foundational test before AI is plugged in.
