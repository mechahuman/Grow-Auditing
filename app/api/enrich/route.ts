import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { fetchAllYouTubeData, YouTubeApiError } from '../../../lib/youtube'
import { analyzeChannel } from '../../../lib/ai'
import { computeLeadScore } from '../../../lib/scoring'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { lead_name, found_by, youtube_url, g_factor, email, website, instagram, twitter } = body

  if (!lead_name || !found_by || !youtube_url || !g_factor) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const gFactorNum = parseInt(g_factor, 10)
  if (isNaN(gFactorNum) || gFactorNum < 1 || gFactorNum > 5) {
    return NextResponse.json({ error: 'g_factor must be 1–5' }, { status: 400 })
  }

  let ytData
  try {
    ytData = await fetchAllYouTubeData(youtube_url)
  } catch (err) {
    if (err instanceof YouTubeApiError) {
      const msg =
        err.httpStatus === 404
          ? 'YouTube channel not found. Check the URL and try again.'
          : err.httpStatus === 503
          ? 'YouTube API quota exceeded. Try again later.'
          : `YouTube API error: ${err.message}`
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 500 })
  }

  const aiResult = await analyzeChannel(ytData)
  const { analysis } = aiResult

  // Extract instagram and twitter from socialLinks
  const instagramLink = ytData.socialLinks?.find(l => l.platform === 'instagram')?.url ?? instagram ?? null
  const twitterLink = ytData.socialLinks?.find(l => l.platform === 'twitter')?.url ?? twitter ?? null

  const score = computeLeadScore({
    hasYouTube: true,
    subscriberCount: ytData.subscriberCount,
    avgViewsLast10: ytData.avgViewsLast10,
    gFactor: gFactorNum as 1 | 2 | 3 | 4 | 5,
  })

  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert({
      user_id: user.id,
      lead_name,
      found_by,
      youtube_url,
      g_factor: gFactorNum,
      youtube_handle: ytData.handle,
      youtube_channel_id: ytData.channelId,
      subscriber_count: ytData.subscriberCount,
      total_views: ytData.totalViews,
      video_count: ytData.videoCount,
      channel_created_at: ytData.channelCreatedAt,
      last_upload_at: ytData.lastUploadAt,
      avg_views_last_10: ytData.avgViewsLast10,
      s2v_ratio_pct: ytData.s2vRatioPct,
      posting_frequency_30d: ytData.postingFrequency30d,
      email: email || ytData.email || null,
      website: website || ytData.website || null,
      instagram: instagramLink,
      twitter: twitterLink,
      category: analysis.category,
      content_style: analysis.content_style,
      posting_pattern: analysis.posting_pattern,
      monetization: analysis.monetization,
      strengths: analysis.strengths,
      concerns: analysis.concerns,
      data_gaps: analysis.data_gaps,
      remarks_ai_draft: analysis.remarks_draft,
      remarks_final: analysis.remarks_draft,
      yt_score_factor: score.ytScoreFactor,
      sub_range_factor: score.subRangeFactor,
      s2v_factor: score.s2vFactor,
      g_factor_normalized: score.gFactorNormalized,
      lead_score_total: score.leadScoreTotal,
      ai_confidence: analysis.ai_confidence,
      channel_thumbnail_url: ytData.thumbnailUrl,
      draft: true,
      status: 'new',
      enriched_by: user.email,
      raw_youtube_data: {
        recentVideos: ytData.recentVideos,
        channel: ytData.rawApiResponses.channel,
      },
      raw_ai_response: aiResult.enrichment_partial
        ? { partial: true, raw: aiResult.raw_response }
        : { raw: aiResult.raw_response },
    })
    .select('id')
    .single()

  if (insertError || !lead) {
    console.error('Supabase insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }

  return NextResponse.json({ leadId: lead.id })
}
