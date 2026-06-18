import * as cheerio from 'cheerio'
import type { AboutData } from './types'

const SOCIAL_DOMAINS: Record<string, string> = {
  'twitter.com': 'twitter',
  'x.com': 'twitter',
  'instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'facebook.com': 'facebook',
  'linkedin.com': 'linkedin',
  'twitch.tv': 'twitch',
}

// YouTube wraps external links: https://www.youtube.com/redirect?q=https%3A%2F%2F...
function decodeYtRedirect(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.pathname === '/redirect') {
      return u.searchParams.get('q') ?? url
    }
  } catch { /* ignore */ }
  return url
}

// Reliably extract a JSON blob assigned to a variable in a <script> tag.
// Uses brace-counting instead of regex to handle nested braces in the JSON value.
function extractJsonBlob(html: string, varName: string): unknown {
  const marker = `var ${varName} = `
  const start = html.indexOf(marker)
  if (start === -1) return null

  const jsonStart = start + marker.length
  if (html[jsonStart] !== '{') return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) {
        try { return JSON.parse(html.slice(jsonStart, i + 1)) } catch { return null }
      }
    }
  }
  return null
}

// Recursively find the first occurrence of a string value for a given key.
function findStringValue(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== 'object') return null
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === key && typeof v === 'string') return v
    const found = findStringValue(v, key)
    if (found !== null) return found
  }
  return null
}

// Extract links from channelExternalLinkViewModel nodes (current YouTube structure).
// Returns { title, url } for each link found.
function findChannelExternalLinks(obj: unknown, out: Array<{ title: string; url: string }> = [], depth = 0): Array<{ title: string; url: string }> {
  if (!obj || typeof obj !== 'object' || depth > 50) return out

  const o = obj as Record<string, unknown>

  // Check if this node is a channelExternalLinkViewModel
  if (o['channelExternalLinkViewModel']) {
    const vm = o['channelExternalLinkViewModel'] as Record<string, unknown>
    const titleObj = vm['title'] as Record<string, unknown> | undefined
    const titleContent = titleObj?.['content']
    const linkObj = vm['link'] as Record<string, unknown> | undefined
    const commandRuns = linkObj?.['commandRuns'] as Array<Record<string, unknown>> | undefined

    if (typeof titleContent === 'string' && Array.isArray(commandRuns) && commandRuns.length > 0) {
      for (const run of commandRuns) {
        if (typeof run !== 'object' || run === null) continue
        const onTap = run['onTap'] as Record<string, unknown> | undefined
        const innertubeCommand = onTap?.['innertubeCommand'] as Record<string, unknown> | undefined
        const urlEndpoint = innertubeCommand?.['urlEndpoint'] as Record<string, unknown> | undefined
        const rawUrl = urlEndpoint?.['url']
        if (typeof rawUrl === 'string') {
          const decoded = decodeYtRedirect(rawUrl)
          if (decoded.startsWith('http')) {
            out.push({ title: titleContent, url: decoded })
            break
          }
        }
      }
    }
  }

  for (const v of Object.values(o)) {
    if (typeof v === 'object' && v !== null) findChannelExternalLinks(v, out, depth + 1)
  }

  return out
}

// Collect all external URLs from navigationEndpoint.urlEndpoint.url patterns (fallback for old structure).
function collectExternalLinks(obj: unknown, out: string[] = []): string[] {
  if (!obj || typeof obj !== 'object') return out

  const o = obj as Record<string, unknown>

  // Pattern: { navigationEndpoint: { urlEndpoint: { url: '...' } } }
  const nav = o['navigationEndpoint'] as Record<string, unknown> | undefined
  const urlEndpoint = nav?.['urlEndpoint'] as Record<string, unknown> | undefined
  const rawUrl = urlEndpoint?.['url']
  if (typeof rawUrl === 'string') {
    const decoded = decodeYtRedirect(rawUrl)
    if (decoded.startsWith('http') && !decoded.includes('youtube.com')) {
      out.push(decoded)
    }
  }

  // Also check for direct urlEndpoint.url pattern (catches more edge cases)
  const directUrlEndpoint = o['urlEndpoint'] as Record<string, unknown> | undefined
  const directUrl = directUrlEndpoint?.['url']
  if (typeof directUrl === 'string') {
    const decoded = decodeYtRedirect(directUrl)
    if (decoded.startsWith('http') && !decoded.includes('youtube.com')) {
      out.push(decoded)
    }
  }

  for (const v of Object.values(o)) {
    if (typeof v === 'object') collectExternalLinks(v, out)
  }

  return out
}

export async function scrapeAboutPage(handleOrChannelId: string, isChannelId = false): Promise<AboutData> {
  const path = isChannelId
    ? `/channel/${handleOrChannelId}/about`
    : `/@${handleOrChannelId}/about`
  const url = `https://www.youtube.com${path}`

  try {
    await new Promise(r => setTimeout(r, 300))  // polite delay

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) {
      console.warn(`[AboutScraper] HTTP ${res.status} for ${url} — skipping`)
      return { email: null, website: null, socialLinks: [], merch: null }
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    let ytData: unknown = null
    $('script').each((_, el) => {
      if (ytData) return
      const text = $(el).text()
      if (text.includes('ytInitialData')) {
        ytData = extractJsonBlob(text, 'ytInitialData')
      }
    })

    if (!ytData) {
      console.warn(`[AboutScraper] Could not parse ytInitialData for ${url}`)
      return { email: null, website: null, socialLinks: [], merch: null }
    }

    console.log(`[AboutScraper] Successfully parsed ytInitialData for ${url}`)

    const email = findStringValue(ytData, 'businessEmail')

    // Extract links from new YouTube structure (channelExternalLinkViewModel)
    let newStructureLinks: Array<{ title: string; url: string }> = []
    try {
      newStructureLinks = findChannelExternalLinks(ytData)
    } catch (e) {
      console.warn(`[AboutScraper] Error extracting new-structure links for ${url}:`, e instanceof Error ? e.message : e)
    }

    // Fall back to old structure
    let rawLinks: string[] = []
    try {
      rawLinks = collectExternalLinks(ytData)
    } catch (e) {
      console.warn(`[AboutScraper] Error extracting old-structure links for ${url}:`, e instanceof Error ? e.message : e)
    }
    const seen = new Set<string>()
    const deduped = rawLinks.filter(u => { if (seen.has(u)) return false; seen.add(u); return true })

    const socialPlatforms = new Set(Object.values(SOCIAL_DOMAINS))
    let website: string | null = null
    let merch: string | null = null
    const socialLinks: Array<{ platform: string; url: string }> = []

    // Process new structure links first (they have reliable titles)
    for (const link of newStructureLinks) {
      const title = link.title.toLowerCase()
      try {
        const host = new URL(link.url).hostname.replace(/^www\./, '')
        const platform = SOCIAL_DOMAINS[host]
        if (platform && socialPlatforms.has(platform)) {
          socialLinks.push({ platform, url: link.url })
        } else if (title.includes('merch') || title.includes('store') || title.includes('shop')) {
          if (!merch) merch = link.url
        } else if (!website) {
          website = link.url
        }
      } catch { /* invalid URL — skip */ }
    }

    // Then process old structure links, skip if already captured
    for (const link of deduped) {
      const alreadyCaptured = newStructureLinks.some(l => l.url === link)
      if (alreadyCaptured) continue

      try {
        const host = new URL(link).hostname.replace(/^www\./, '')
        const platform = SOCIAL_DOMAINS[host]
        if (platform && socialPlatforms.has(platform)) {
          const exists = socialLinks.some(s => s.url === link)
          if (!exists) socialLinks.push({ platform, url: link })
        } else if (!website) {
          website = link
        }
      } catch { /* invalid URL — skip */ }
    }

    return { email, website, socialLinks, merch }

  } catch (err) {
    console.warn(`[AboutScraper] Failed for ${url}:`, err instanceof Error ? err.message : err)
    return { email: null, website: null, socialLinks: [], merch: null }
  }
}
