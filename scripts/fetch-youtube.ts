// Pipeline test CLI: fetch YouTube data → compute score → save to Supabase as a draft lead.
// Usage: npm run fetch-youtube -- <youtube-url> [lead_name] [found_by] [g_factor]
//
// lead_name  defaults to the channel title
// found_by   defaults to 'CLI'
// g_factor   defaults to 3 (1–5 scale, required for scoring)

import { fetchAllYouTubeData, YouTubeApiError } from '../lib/youtube'
import { computeLeadScore } from '../lib/scoring'
import { createServiceClient } from '../lib/supabase/service'

const youtubeUrl = process.argv[2]
if (!youtubeUrl) {
  console.error('Usage: npm run fetch-youtube -- <youtube-url> [lead_name] [found_by] [g_factor]')
  process.exit(1)
}

async function main() {
  console.log(`\nFetching: ${youtubeUrl}\n`)

  let data
  try {
    data = await fetchAllYouTubeData(youtubeUrl)
  } catch (err) {
    if (err instanceof YouTubeApiError) {
      console.error(`YouTube API error (HTTP ${err.httpStatus}): ${err.message}`)
    } else {
      console.error('Pipeline error:', err instanceof Error ? err.message : err)
    }
    process.exit(1)
  }

  console.log('=== Channel ===')
  console.log('Channel ID:       ', data.channelId)
  console.log('Handle:           ', data.handle ?? '—')
  console.log('Title:            ', data.title)
  console.log('Subscribers:      ', data.subscriberCount.toLocaleString())
  console.log('Total views:      ', data.totalViews.toLocaleString())
  console.log('Video count:      ', data.videoCount)
  console.log('Channel created:  ', data.channelCreatedAt.toISOString().slice(0, 10))
  console.log('Last upload:      ', data.lastUploadAt?.toISOString().slice(0, 10) ?? '—')

  console.log('\n=== Engagement ===')
  console.log('Avg views (last 10):', data.avgViewsLast10?.toLocaleString() ?? '—')
  console.log('S2V ratio %:        ', data.s2vRatioPct ?? '—')
  console.log('Posts last 30 days: ', data.postingFrequency30d)

  console.log('\n=== Contact ===')
  console.log('Email:  ', data.email ?? '—')
  console.log('Website:', data.website ?? '—')
  if (data.socialLinks.length > 0) {
    data.socialLinks.forEach(l => console.log(`  ${l.platform}: ${l.url}`))
  }

  console.log('\n=== Recent Videos (top 5) ===')
  data.recentVideos.slice(0, 5).forEach(v => {
    console.log(`  ${v.publishedAt.toISOString().slice(0, 10)} | ${v.viewCount.toLocaleString().padStart(8)} views | ${v.title.slice(0, 55)}`)
  })

  // Scoring
  const gFactor = Math.min(5, Math.max(1, parseInt(process.argv[5] ?? '3', 10) || 3)) as 1 | 2 | 3 | 4 | 5
  const scoring = computeLeadScore({
    hasYouTube: true,
    subscriberCount: data.subscriberCount,
    avgViewsLast10: data.avgViewsLast10,
    gFactor,
  })

  console.log(`\n=== Score (g_factor=${gFactor}) ===`)
  console.log('YT factor:      ', scoring.ytScoreFactor)
  console.log('Sub range:      ', scoring.subRangeFactor)
  console.log('S2V factor:     ', scoring.s2vFactor)
  console.log('G factor norm:  ', scoring.gFactorNormalized)
  console.log('TOTAL:          ', scoring.leadScoreTotal, '—', scoring.label)

  // Save to Supabase
  const leadName = process.argv[3] ?? data.title
  const foundBy  = process.argv[4] ?? 'CLI'

  console.log('\n=== Saving to Supabase (draft=true) ===')
  const supabase = createServiceClient()

  const { data: row, error } = await supabase
    .from('leads')
    .insert({
      youtube_url:            youtubeUrl,
      youtube_channel_id:     data.channelId,
      youtube_handle:         data.handle,
      lead_name:              leadName,
      found_by:               foundBy,
      g_factor:               gFactor,
      subscriber_count:       data.subscriberCount,
      total_views:            data.totalViews,
      video_count:            data.videoCount,
      channel_created_at:     data.channelCreatedAt.toISOString(),
      last_upload_at:         data.lastUploadAt?.toISOString() ?? null,
      avg_views_last_10:      data.avgViewsLast10,
      s2v_ratio_pct:          data.s2vRatioPct,
      posting_frequency_30d:  data.postingFrequency30d,
      email:                  data.email,
      website:                data.website,
      yt_score_factor:        scoring.ytScoreFactor,
      sub_range_factor:       scoring.subRangeFactor,
      s2v_factor:             scoring.s2vFactor,
      g_factor_normalized:    scoring.gFactorNormalized,
      lead_score_total:       scoring.leadScoreTotal,
      raw_youtube_data:       data.rawApiResponses,
      draft:                  true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase insert failed:', error.message)
    process.exit(1)
  }

  console.log('Saved! Lead ID:', row.id)
  console.log('\nDone.')
}

main().catch(err => {
  console.error('FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
})
