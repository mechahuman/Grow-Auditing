import type { YouTubeEnrichmentResult } from '../youtube/types'

function monthsAgo(date: Date): number {
  const now = new Date()
  return Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )
}

function daysAgo(date: Date): number {
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m${s > 0 ? `${s}s` : ''}`
}

export function buildUserPrompt(data: YouTubeEnrichmentResult): string {
  const channelAgeMonths = monthsAgo(data.channelCreatedAt)
  const lastUploadStr = data.lastUploadAt
    ? `${daysAgo(data.lastUploadAt)} days ago`
    : 'Unknown'

  const avgViewsStr =
    data.avgViewsLast10 != null
      ? data.avgViewsLast10.toLocaleString()
      : 'insufficient data'

  const s2vStr =
    data.s2vRatioPct != null ? `${data.s2vRatioPct}%` : 'insufficient data'

  const bioStr = data.description?.trim()
    ? data.description.slice(0, 300)
    : 'Not provided'

  const videosSection = data.recentVideos
    .slice(0, 10)
    .map((v) => {
      const ago = daysAgo(v.publishedAt)
      const dur = formatDuration(v.durationSec)
      return `- "${v.title}" — ${ago}d ago — ${v.viewCount.toLocaleString()} views, ${v.likeCount} likes, ${v.commentCount} comments, ${dur}`
    })
    .join('\n')

  const socialStr =
    data.socialLinks.length > 0
      ? data.socialLinks.map((s) => `${s.platform}: ${s.url}`).join(', ')
      : 'None visible'

  return `Here is the data for a YouTube channel I would like you to analyze.

## Channel basics
- Title: ${data.title}
- Handle: ${data.handle ?? 'Unknown'}
- Bio: ${bioStr}
- Subscribers: ${data.subscriberCount.toLocaleString()}
- Total channel views: ${data.totalViews.toLocaleString()}
- Total videos: ${data.videoCount}
- Channel age: ${channelAgeMonths} months
- Last upload: ${lastUploadStr}
- Avg views (last 10 videos): ${avgViewsStr}
- S2V ratio: ${s2vStr}
- Videos posted in last 30 days: ${data.postingFrequency30d}

## Recent videos (last ${Math.min(data.recentVideos.length, 10)})
${videosSection || 'No recent videos available'}

## External context
- Website: ${data.website ?? 'Not found'}
- Social links: ${socialStr}

Submit your analysis as JSON.`
}
