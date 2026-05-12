# 05 — AI Analysis Layer

The AI's job is to take structured YouTube data and produce structured observations + a draft remarks paragraph. It does not score the lead (that's the rubric's job). It does not make decisions (that's the human's job).

---

## Tone and style guidance

Per Manav's decision: **neutral/professional tone** with a light touch of personality. The employee will add stronger voice/personality when editing.

Do:
- Speak observationally ("Posts weekly, mostly tutorials")
- Note specific evidence ("Most recent video underperformed at 200 views vs. channel average of 1,200")
- Use precise descriptors ("Talking-head format, on-camera, casual production")

Avoid:
- Slang or in-jokes ("Bro needs a miracle")
- Speculation about the person ("They seem motivated")
- Made-up numbers ("Likely making $5K/mo")
- Hype words ("Amazing content", "incredible engagement")

If the AI doesn't see evidence for something, it should say so explicitly: `"Unable to assess monetization — no products visible on linked sites."`

---

## Input to the AI

The orchestrator builds a structured context object from the YouTube pipeline output and passes it to Claude.

```typescript
{
  channel: {
    title: string;
    handle: string;
    description: string;            // channel bio
    subscriberCount: number;
    totalViews: number;
    videoCount: number;
    channelAgeMonths: number;       // computed from createdAt
    lastUploadDaysAgo: number;
    avgViewsLast10: number;
    s2vRatioPct: number;
  },
  recentVideos: Array<{
    title: string;
    daysAgo: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    durationSec: number;
    descriptionSnippet: string;     // first 200 chars
  }>,
  externalContext: {
    website: string | null;
    socialLinks: Array<{ platform: string; url: string }>;
  }
}
```

Keep the input compact. The total prompt should be under ~3,000 tokens.

---

## Expected output (structured JSON)

The AI must return a JSON object matching this schema. Use Claude's tool use / structured output to enforce this — don't rely on parsing free text.

```typescript
{
  category: string;
  // 2–6 words, e.g., "ADHD productivity creator", "B2B AI automation agency"

  content_style: string;
  // 2–8 words describing how they make content
  // e.g., "Talking-head tutorials", "Faceless commentary", "Podcast-style interviews"

  monetization: string;
  // What they appear to sell, or "Not visible" if unclear
  // e.g., "PDF guide, £14 one-time", "B2B agency services", "Not visible"

  posting_pattern: string;
  // e.g., "Weekly, consistent", "Sporadic, last 60 days quiet", "Newly active"

  strengths: string[];
  // 2–4 specific, evidence-backed observations
  // e.g., ["Clear niche focus on ADHD productivity",
  //        "Consistent 12-min long-form format",
  //        "Engagement rate above channel size norm (4%)"]

  concerns: string[];
  // 2–4 specific concerns
  // e.g., ["Hook quality weak — first 3 seconds of recent videos don't grab",
  //        "No visible CTA or monetization mechanism",
  //        "Posting cadence dropped from weekly to monthly in last 90 days"]

  remarks_draft: string;
  // 2–4 sentences synthesizing the above into a paragraph
  // Editable by employee on review screen

  ai_confidence: "low" | "medium" | "high";
  // How grounded is this analysis in the actual data?
  // - low: very few videos / sparse data
  // - medium: enough to make reasonable observations
  // - high: rich data, clear patterns

  data_gaps: string[];
  // Things the AI couldn't determine, e.g.,
  // ["Could not access website to verify monetization",
  //  "Only 3 videos in last 6 months — limits content pattern analysis"]
}
```

---

## The prompt

Use Claude 3.5 Sonnet (or whatever the current strong general-purpose Claude model is at build time). For the API call:

```typescript
{
  model: "claude-sonnet-4-5" /* or current */,
  max_tokens: 2000,
  system: SYSTEM_PROMPT,
  messages: [
    { role: "user", content: USER_PROMPT_WITH_DATA }
  ],
  tools: [{ name: "submit_analysis", input_schema: OUTPUT_SCHEMA }],
  tool_choice: { type: "tool", name: "submit_analysis" }
}
```

Forcing tool use guarantees structured output.

### System prompt

```
You are a lead analyst for a digital marketing agency that helps creators build their businesses. You analyze YouTube channels and produce structured observations to help the agency's team decide whether a creator is a good fit to work with.

Your job:
- Read the channel data provided
- Produce factual, evidence-based observations
- Highlight strengths and concerns the team should know about
- Draft a short remarks paragraph in a neutral, professional tone

Critical rules:
1. NEVER invent numbers. Do not estimate revenue, audience size beyond what's provided, or business stage. If you can't see evidence, say "Not visible" or "Unable to assess."
2. Anchor every observation to specific data. If you say "engagement is weak," reference the numbers that show it.
3. Stay neutral in tone. The team will add personality when they edit.
4. Be concise. Strengths and concerns are bullet observations, not paragraphs.
5. The remarks_draft should be 2–4 sentences that the team can lightly edit. Do not write an essay.
6. If data is sparse (e.g., only 2 videos in the last year), set ai_confidence to "low" and explain in data_gaps.
7. Mark anything you couldn't determine in data_gaps. This is a feature, not a failure.

You will submit your analysis via the submit_analysis tool. Do not respond with anything else.
```

### User prompt template

```
Here is the data for a YouTube channel I'd like you to analyze.

## Channel basics
- Title: {channel.title}
- Handle: {channel.handle}
- Bio: {channel.description}
- Subscribers: {channel.subscriberCount}
- Total channel views: {channel.totalViews}
- Total videos: {channel.videoCount}
- Channel age: {channel.channelAgeMonths} months
- Last upload: {channel.lastUploadDaysAgo} days ago
- Avg views (last 10 videos): {channel.avgViewsLast10}
- S2V ratio: {channel.s2vRatioPct}%

## Recent videos (last 10)
{for each video:}
- "{title}" — {daysAgo}d ago — {viewCount} views, {likeCount} likes, {commentCount} comments, {duration} long
  Description snippet: {descriptionSnippet}

## External context
- Website: {externalContext.website || "Not found"}
- Other social presence: {externalContext.socialLinks.map(...) || "None visible"}

Submit your analysis.
```

---

## Calibration: how to know the prompt is working

After implementing the prompt, run it against the 7 example leads from Manav's existing sheet (listed in `04-youtube-pipeline.md`).

For each, compare:

1. The AI's `category` vs. the sheet's existing "Category" column
2. The AI's `strengths` and `concerns` vs. the sheet's existing "Remarks" column
3. The AI's `remarks_draft` vs. the sheet's actual remarks

The AI won't match perfectly — that's expected. The question is: **would the AI's draft be a useful starting point for the employee, or is it actively misleading?**

Iterate the prompt 2–3 times. After each iteration, re-run on the same 7 leads. Track changes in a calibration doc (`docs/calibration-notes.md`). Stop iterating when the AI:

- Correctly categorizes 6/7 leads
- Surfaces strengths/concerns that the existing remarks mention (or things the human missed)
- Produces remark drafts that need editing but not rewriting

This calibration step is the most important part of the AI work. Budget time for it.

---

## Cost expectations

Per enrichment:
- Input tokens: ~1,500–2,500 (channel data + recent videos)
- Output tokens: ~500–800 (structured analysis)
- Cost on Claude Sonnet: roughly **₹3–₹8 per enrichment**

At 200 enrichments/month → ~₹600–₹1,600/month in Claude costs. Negligible.

---

## Failure modes and handling

| Failure | Behavior |
|---|---|
| Claude returns invalid JSON | Retry once with same prompt. If still fails, fall back: save raw response in `raw_ai_response`, leave AI fields blank, flag `enrichment_partial=true`. |
| Claude API timeout | Retry once. Then fail with clear error to user. |
| Claude API rate limited | Wait 30s and retry. |
| Output contains made-up numbers | This is a prompt issue, not a runtime issue. Catch during calibration, tighten prompt. |
| All factors return same value across leads | Prompt is too generic. Tighten with more specific instructions and examples. |

---

## Implementation structure

```
/lib/ai/
  client.ts            # Claude API client (thin wrapper)
  promptBuilder.ts     # Builds the user prompt from data
  systemPrompt.ts      # The static system prompt as a constant
  schema.ts            # The OUTPUT_SCHEMA constant for tool use
  analyzer.ts          # analyzeChannel() — main entry point
  types.ts
  index.ts
```

Keep the prompt template and system prompt as separate exported constants. This makes it easy to A/B test prompts later.

---

## What NOT to do with the AI in v1

- **Don't ask AI to compute the score.** Scoring is deterministic per `03-scoring-rubric.md`. AI is for observations only.
- **Don't ask AI to fetch external data.** It only analyzes what we feed it.
- **Don't pass video transcripts.** This was considered but is too slow/expensive for v1. Title + description + view counts give us 80% of the signal.
- **Don't pass thumbnails.** Same reason. Could revisit in v2 with vision API for thumbnail quality.
- **Don't run multiple AI calls per lead.** One call returns everything. Multiple calls = slower + costlier + more failure surface.
