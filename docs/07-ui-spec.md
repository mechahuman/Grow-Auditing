# 07 — UI Specification

The v1 has three screens an employee uses, plus a login and a list view. Minimal, functional, and built with Next.js App Router + Tailwind. No fancy component library required, though shadcn/ui would be reasonable if Claude Code prefers it.

---

## Screen 1: Login

Standard Supabase Auth flow. Email + password OR magic link — pick one, magic link is simpler.

After login, redirect to `/leads` (the list view).

---

## Screen 2: Leads List (`/leads`)

The default landing page after login.

### Layout

- Header with "New Lead" button on the right
- Table of past leads, most recent first
- Filter chips: "All", "Strong fit (4+)", "Solid fit (3+)", "Mine"
- Search input (filters by lead name)

### Columns shown

- Lead Name
- Found By
- YT Subscribers
- Lead Score (with color label per `03-scoring-rubric.md`)
- Status
- Date Added
- Action: "Open"

Clicking "Open" navigates to the lead's review page (`/leads/{id}`).

### Empty state

When there are no leads yet, show a friendly empty state with a "Create your first lead" button.

---

## Screen 3: Enrich Form (`/enrich`)

Accessible via "New Lead" button on the list page.

### Layout

A vertical form with these fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| Lead Name | Text input | Yes | Full name as displayed publicly |
| Found By | Dropdown | Yes | Populated from `team_members` table |
| YouTube URL | Text input | Yes | Validated client-side (must contain youtube.com or youtu.be) |
| G-Factor | 1–5 selector | Yes | Radio buttons or dropdown, with helper text "Your gut feeling for this lead" |
| Email | Text input | No | Optional — will be auto-fetched if blank |
| Website | Text input | No | Optional — will be auto-fetched if blank |

A single primary button: **"Enrich Lead"**.

### Validation

- Client-side: required fields, YouTube URL format
- Server-side: URL resolves to a real channel

If validation fails, show inline errors next to the field.

### On submit

- Disable the form
- POST to `/api/enrich` with the form payload
- Navigate to a progress page (Screen 4)

---

## Screen 4: Progress (`/enrich/progress`)

Shown immediately after submit. The form data is held in client state (or URL params); the enrichment happens server-side.

### Layout

- Large centered area with a spinner
- A live status message that updates:
  - "Validating YouTube URL..."
  - "Fetching channel data..."
  - "Analyzing recent videos..."
  - "Looking up contact info..."
  - "Running AI analysis..."
  - "Almost done..."

### How status updates work

Two options, simplest first:

**Option A (recommended for v1): Simulated status messages**

The client cycles through a fixed list of status messages on a timer (every 8–12 seconds), while a single long-running fetch to `/api/enrich` runs in the background. When the fetch resolves, navigate to the review screen with the resulting lead ID.

This is fake-but-honest: the messages reflect what's roughly happening on the server, even though they're client-driven.

**Option B (later): Server-sent events**

Use SSE to stream actual progress from the server. More complex, not necessary for v1.

### On completion

- Server returns `{ leadId: "uuid" }`
- Client navigates to `/leads/{leadId}/review`

### On failure

- Show an error card with the error message and a "Try again" button that returns to `/enrich`

---

## Screen 5: Review & Edit (`/leads/{id}/review`)

The most important screen. Shows the enriched lead and lets the employee edit before saving.

### Layout

A two-column layout (or single column on narrow screens):

**Left column — Read-only context:**
- YouTube channel embedded preview (use YouTube's official embed or just show channel title + link)
- Subscriber count, total views, video count
- Last upload, channel age
- Avg views (last 10)
- S2V ratio %
- List of last 5 video titles + view counts

**Right column — Editable fields:**

| Field | Editable? | Default value |
|---|---|---|
| Lead Name | Yes | From form |
| Found By | Yes | From form |
| G-Factor | Yes | From form |
| Email | Yes | From scrape (may be blank) |
| Website | Yes | From scrape (may be blank) |
| Category | Yes | From AI |
| Content Style | Yes | From AI |
| Monetization | Yes | From AI |
| Remarks (Final) | Yes | Pre-filled with AI draft |
| Status | Yes (dropdown) | "new" |
| Status Notes | Yes | Blank |

### Score display

At the top of the right column, prominently show:

- **Lead Score: 3.8 / 5** (large, with color label like "Solid fit")
- Below: small breakdown showing each factor's contribution
  - YT: 1.0
  - Sub Range: 0.5
  - S2V: 1.0
  - G-Factor: 0.75 → normalized
- A small "What is this?" link that opens an explanation modal

The score should update live if the user changes G-Factor on this screen (and only G-Factor — the other factors are derived from YouTube data, which is frozen).

### AI confidence and gaps

Below the score, show a callout:

- AI confidence: medium
- Data gaps: "Could not access website to verify monetization"

This is honest about what the AI couldn't determine.

### Original AI draft (collapsible)

Below the editable "Remarks (Final)" textarea, a collapsible "Show original AI draft" section that displays `remarks_ai_draft` verbatim. Lets the user see what changed.

### Primary action

A single **"Save Lead"** button at the bottom.

On save:
- POST to `/api/save` with the lead ID and the edited values
- Show success toast "Lead saved to sheet"
- Navigate to `/leads` (the list)

### Discard

Secondary button: **"Discard"**. Opens a confirmation modal. On confirm:
- DELETE to `/api/leads/{id}` (removes the unsaved enrichment record)
- Navigate back to `/leads`

> Note: we DO persist the enrichment to Supabase immediately (with a `draft=true` flag). Discard just deletes that draft. This way if the user closes the browser by accident, they can come back and the enrichment isn't lost.

---

## Visual design notes

- Keep it boring. Tailwind defaults. Minimal custom CSS.
- White background, dark text. One accent color for primary buttons.
- Use the score's color label for the score badge only — don't over-color the rest of the UI.
- Mobile-friendly but desktop-first (this is an internal tool, employees use it at desks).

If using a component library: `shadcn/ui` is a good match for Claude Code — it's just code that's added to the repo, not a dependency, so it's easy to customize.

---

## Implementation structure

```
/app
  /(authenticated)
    /layout.tsx              # Auth guard, navbar
    /leads
      /page.tsx              # List view
      /[id]
        /review/page.tsx     # Review & edit
    /enrich
      /page.tsx              # Input form
      /progress
        /page.tsx            # Progress screen
  /login
    /page.tsx
  /layout.tsx                # Root layout
  /api
    /enrich/route.ts
    /save/route.ts
    /leads/route.ts
    /leads/[id]/route.ts

/components
  /LeadCard.tsx
  /LeadScoreDisplay.tsx
  /EnrichForm.tsx
  /ReviewForm.tsx
  /ProgressIndicator.tsx
  /ui/*                       # shadcn/ui components if used
```

---

## Out of scope for v1

These would be nice but skip for v1:

- Editing past leads from the list (open them in read-only mode is fine)
- Bulk operations (delete multiple, change status of multiple)
- Export to CSV (the Google Sheet already serves this)
- Dashboard charts / analytics
- Comments / collaboration threads on leads
- Re-enrichment (re-running the YouTube fetch on an existing lead)

Capture these in the future-features list for v2.
