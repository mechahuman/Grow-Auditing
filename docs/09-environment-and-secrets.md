# 09 — Environment and Secrets

Every key, env var, and external account needed to run the system.

---

## Required external accounts

| Service | Why | Cost | Setup time |
|---|---|---|---|
| Vercel | Hosting | Free tier sufficient | 5 min |
| Supabase | DB + Auth | Free tier sufficient | 10 min |
| Google Cloud | YouTube API + Sheets API | Free tier sufficient | 20 min |
| Anthropic (Claude API) | AI analysis | Pay-as-you-go, ~₹3–8 per enrichment | 10 min |
| GitHub | Repo hosting | Free | 2 min (if not already set up) |
| Sentry (optional) | Error tracking | Free tier | 5 min |

Total setup: ~60–90 minutes of clicking through dashboards before any code runs.

---

## Required environment variables

Create `.env.local` for local dev. Never commit. Mirror to Vercel's env vars dashboard for production.

```bash
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                  # Public, safe for client
SUPABASE_SERVICE_ROLE_KEY=eyJ...                      # Server-only, never expose to client

# === YouTube Data API ===
YOUTUBE_API_KEY=AIza...                               # From Google Cloud Console

# === Google Sheets ===
GOOGLE_SHEET_ID=1abc...xyz                            # From the sheet's URL
GOOGLE_SERVICE_ACCOUNT_JSON_B64=eyJ0eXBlI...          # Base64-encoded service account JSON

# === Claude (Anthropic) ===
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5                     # Or current strong model

# === App config ===
NEXT_PUBLIC_APP_URL=http://localhost:3000             # Used for magic link redirects
NODE_ENV=development

# === Optional ===
SENTRY_DSN=https://...@sentry.io/...                  # Optional, error tracking
```

---

## How to obtain each

### Supabase keys

1. Create project at supabase.com
2. Project Settings → API
3. Copy `URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ never expose to browser)

### YouTube API key

1. Go to console.cloud.google.com
2. Create a new project (or use an existing one)
3. APIs & Services → Library → enable "YouTube Data API v3"
4. APIs & Services → Credentials → Create Credentials → API key
5. Copy the key → `YOUTUBE_API_KEY`
6. **Restrict the key:**
   - Application restrictions: HTTP referrers if frontend-only, or none if server-only
   - API restrictions: only YouTube Data API v3

### Google Sheets service account

1. Same Google Cloud project as above
2. APIs & Services → Library → enable "Google Sheets API"
3. IAM & Admin → Service Accounts → Create
4. Name: `lead-intel-sheets-writer`
5. Skip role assignment
6. Done → click into the new service account → Keys → Add Key → JSON
7. Download the JSON file
8. Base64-encode it:
   ```bash
   base64 -i service-account.json | tr -d '\n' > sa.b64.txt
   ```
   (On Windows: `certutil -encode service-account.json sa.b64.txt`)
9. Copy the contents of `sa.b64.txt` → `GOOGLE_SERVICE_ACCOUNT_JSON_B64`
10. **Important:** Share the target Google Sheet with the service account's email (visible in the JSON) as an Editor.

### Google Sheet ID

1. Create or open your target sheet
2. From the URL `https://docs.google.com/spreadsheets/d/THIS_PART/edit#gid=0`, copy `THIS_PART`
3. Set as `GOOGLE_SHEET_ID`

### Anthropic API key

1. Go to console.anthropic.com
2. Settings → API Keys → Create Key
3. Copy → `ANTHROPIC_API_KEY`
4. Add a small initial credit (₹500 is more than enough for the trial)

### Sentry (optional)

1. Go to sentry.io, create a project (Next.js)
2. Copy the DSN → `SENTRY_DSN`
3. Run `npx @sentry/wizard@latest -i nextjs` to auto-configure

---

## `.env.example` (commit this to the repo)

```bash
# Copy this file to .env.local and fill in real values.

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

YOUTUBE_API_KEY=

GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_JSON_B64=

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

SENTRY_DSN=
```

---

## Local dev setup (the README's quickstart)

```bash
# 1. Clone and install
git clone <repo>
cd lead-intel-system
npm install

# 2. Set up env
cp .env.example .env.local
# (fill in values per the guide above)

# 3. Run Supabase migrations
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push

# 4. Initialize the Google Sheet
npm run init-sheet

# 5. Seed team members and statuses
npm run seed

# 6. Run dev server
npm run dev
```

The app is now at http://localhost:3000.

---

## Deploying to Vercel

```bash
# 1. Push to GitHub (Vercel reads from GitHub)
git push origin main

# 2. Import the repo in Vercel dashboard

# 3. Add all env vars in Vercel → Project Settings → Environment Variables
#    (paste each from .env.local)

# 4. Deploy
```

After first deploy:
- Test the magic-link auth (the email should come from `noreply@supabase.io` initially; can be customized later)
- Test one enrichment end-to-end on the deployed URL
- Add the deployed domain to Supabase Auth's redirect URLs list

---

## Cost ceiling: trial phase

Approximate monthly cost for a trial running ~50–100 enrichments per month:

| Item | Cost |
|---|---|
| Vercel | ₹0 (free tier) |
| Supabase | ₹0 (free tier) |
| YouTube API | ₹0 (free, 10k units/day) |
| Google Sheets API | ₹0 (free) |
| Claude API | ₹300–₹800 |
| Sentry | ₹0 (free tier, 5k errors/month) |
| **Total** | **₹300–₹800/month** |

Well under the "almost free" target.

---

## Security checklist

Before deploying to production:

- [ ] Service role key never exposed to client
- [ ] All `/api/*` routes verify Supabase session
- [ ] Google service account JSON not in any logs
- [ ] Anthropic API key restricted by IP if Vercel supports it (it doesn't currently — rely on key rotation instead)
- [ ] `.env.local` in `.gitignore`
- [ ] No hardcoded secrets anywhere in the codebase (grep for sk- and AIza- before pushing)
- [ ] Supabase Row Level Security policies enabled on all tables (Phase 5 task)
