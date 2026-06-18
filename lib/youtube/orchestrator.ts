import { parseYouTubeUrl } from './parseUrl'
import { fetchChannelByHandle, fetchChannelById, resolveChannelFromLegacy } from './channels'
import { fetchRecentVideoIds, fetchVideoStats } from './videos'
import { scrapeAboutPage } from './aboutScraper'
import { buildUrl, ytFetch } from './client'
import type { ChannelData, VideoData, YouTubeEnrichmentResult } from './types'

function computeDerived(channel: ChannelData, videos: VideoData[]) {
  const sorted = [...videos].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())

  const lastUploadAt = sorted[0]?.publishedAt ?? null

  const top10 = sorted.slice(0, 10)
  const avgViewsLast10 = top10.length > 0
    ? Math.round(top10.reduce((sum, v) => sum + v.viewCount, 0) / top10.length)
    : null

  const s2vRatioPct = avgViewsLast10 !== null && channel.subscriberCount > 0
    ? Math.round((avgViewsLast10 / channel.subscriberCount) * 1000) / 10
    : null

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const postingFrequency30d = videos.filter(v => v.publishedAt > thirtyDaysAgo).length

  // Group A: computed from video data
  const shortsCount = videos.filter(v => v.durationSec > 0 && v.durationSec < 60).length
  const shortsPct = videos.length > 0
    ? Math.round((shortsCount / videos.length) * 1000) / 10
    : null

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

  const avgDurationSec = top10.length > 0
    ? Math.round(top10.reduce((sum, v) => sum + v.durationSec, 0) / top10.length)
    : null

  const topVideo = top10.length > 0
    ? top10.reduce((best, v) => v.viewCount > best.viewCount ? v : best)
    : null
  const topVideoTitle = topVideo?.title ?? null
  const topVideoUrl = topVideo ? `https://youtube.com/watch?v=${topVideo.videoId}` : null
  const topVideoViews = topVideo?.viewCount ?? null

  return {
    lastUploadAt,
    avgViewsLast10,
    s2vRatioPct,
    postingFrequency30d,
    shortsPct,
    avgLikeRatePct,
    avgCommentRatePct,
    avgDurationSec,
    topVideoTitle,
    topVideoUrl,
    topVideoViews,
  }
}

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
    return false
  }
}

export async function fetchAllYouTubeData(youtubeUrl: string): Promise<YouTubeEnrichmentResult> {
  // Step 1: Parse URL
  const parsed = parseYouTubeUrl(youtubeUrl)

  // Steps 2–3: Resolve channel (includes uploads playlist ID)
  let channel: ChannelData
  if (parsed.type === 'handle') {
    channel = await fetchChannelByHandle(parsed.value)
  } else if (parsed.type === 'channelId') {
    channel = await fetchChannelById(parsed.value)
  } else {
    channel = await resolveChannelFromLegacy(parsed.value)
  }

  // Step 4: Fetch recent video IDs via uploads playlist (1 quota unit)
  const videoIds = await fetchRecentVideoIds(channel.uploadsPlaylistId, 15)

  // Step 5: Fetch video statistics (1 quota unit for ≤50 videos)
  const videos = await fetchVideoStats(videoIds)

  // Step 6: Compute derived fields (including Group A)
  const {
    lastUploadAt,
    avgViewsLast10,
    s2vRatioPct,
    postingFrequency30d,
    shortsPct,
    avgLikeRatePct,
    avgCommentRatePct,
    avgDurationSec,
    topVideoTitle,
    topVideoUrl,
    topVideoViews,
  } = computeDerived(channel, videos)

  // Step 7: Scrape About page — fails gracefully, never blocks enrichment
  const handleSlug = channel.handle?.replace(/^@/, '') ?? null
  const about = await scrapeAboutPage(
    handleSlug ?? channel.channelId,
    handleSlug === null,
  )

  // Step 8: Check for community posts (1 quota unit, fails gracefully)
  const hasCommunityPosts = await checkCommunityPosts(channel.channelId)

  // Step 9: Extract social links
  const tiktok = about.socialLinks.find(l => l.platform === 'tiktok')?.url ?? null
  const linkedin = about.socialLinks.find(l => l.platform === 'linkedin')?.url ?? null
  const facebook = about.socialLinks.find(l => l.platform === 'facebook')?.url ?? null

  // Step 10: Assemble
  return {
    channelId: channel.channelId,
    handle: channel.handle,
    title: channel.title,
    description: channel.description,
    channelCreatedAt: channel.channelCreatedAt,
    subscriberCount: channel.subscriberCount,
    totalViews: channel.totalViews,
    videoCount: channel.videoCount,
    lastUploadAt,
    avgViewsLast10,
    s2vRatioPct,
    postingFrequency30d,
    recentVideos: videos,
    email: about.email,
    website: about.website,
    socialLinks: about.socialLinks,
    thumbnailUrl: channel.thumbnailUrl,

    // Group A: computed from video data
    shortsPct,
    avgLikeRatePct,
    avgCommentRatePct,
    avgDurationSec,
    topVideoTitle,
    topVideoUrl,
    topVideoViews,

    // Group B: from channels.list (already fetched)
    channelCountry: channel.country,
    channelKeywords: channel.keywords,
    isVerified: channel.isVerified,

    // Group C: promoted from socialLinks
    tiktok,
    linkedin,
    facebook,

    // Group D: community posts
    hasCommunityPosts,

    rawApiResponses: {
      channel,
      videoIds,
      videoStats: videos,
    },
  }
}
