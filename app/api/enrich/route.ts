import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { createServiceClient } from '../../../lib/supabase/service'
import { fetchAllYouTubeData, YouTubeApiError } from '../../../lib/youtube'
import { analyzeChannel } from '../../../lib/ai'
import { computeLeadScore } from '../../../lib/scoring'
import { logAPIUsage, createAPITimer } from '../../../lib/api/usage-tracker'

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
  const ytTimer = createAPITimer()
  try {
    console.log('[Enrich] Starting YouTube data fetch for:', youtube_url)
    ytData = await fetchAllYouTubeData(youtube_url)
    console.log('[Enrich] YouTube data fetched successfully')
    // Log successful YouTube API call
    logAPIUsage({
      apiName: 'youtube',
      userId: user.id,
      endpoint: 'channels.list,videos.list,activities.list',
      status: 'success',
      quotaUnitsUsed: 4,
      responseTimeMs: ytTimer(),
    }).catch(() => {}) // Silently ignore logging errors
  } catch (err) {
    console.error('[Enrich] YouTube fetch failed:', err instanceof Error ? err.message : err)
    // Log failed YouTube API call
    logAPIUsage({
      apiName: 'youtube',
      userId: user.id,
      endpoint: 'channels.list,videos.list,activities.list',
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      responseTimeMs: ytTimer(),
    }).catch(() => {})

    if (err instanceof YouTubeApiError) {
      const msg =
        err.httpStatus === 404
          ? 'YouTube channel not found. Check the URL and try again.'
          : err.httpStatus === 503
          ? 'YouTube API quota exceeded. Try again later.'
          : `YouTube API error: ${err.message}`
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    console.error('[Enrich] Non-YouTubeApiError caught:', err)
    return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 500 })
  }

  // Check for duplicate lead with same YouTube channel
  if (ytData.channelId) {
    const serviceClient = createServiceClient()

    // Query for existing lead with this channel ID
    const { data: existingLead } = await serviceClient
      .from('leads')
      .select('id, lead_name, found_by, created_at')
      .eq('youtube_channel_id', ytData.channelId)
      .maybeSingle()

    if (existingLead) {
      // Look up finder's full name from initials
      const { data: finder } = await serviceClient
        .from('team_members')
        .select('name')
        .eq('initials', existingLead.found_by)
        .maybeSingle()

      // Get current assignee from reassignment audit log (most recent)
      const { data: lastReassignment } = await serviceClient
        .from('lead_reassignment_audit')
        .select('new_assignee_id')
        .eq('lead_id', existingLead.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Look up full name of current assignee
      let assignedToName = finder?.name ?? existingLead.found_by
      if (lastReassignment?.new_assignee_id) {
        const { data: currentAssignee } = await serviceClient
          .from('team_members')
          .select('name')
          .eq('user_id', lastReassignment.new_assignee_id)
          .maybeSingle()
        if (currentAssignee?.name) {
          assignedToName = currentAssignee.name
        }
      }

      return NextResponse.json(
        {
          error: 'duplicate',
          leadName: existingLead.lead_name,
          foundBy: finder?.name ?? existingLead.found_by,
          assignedTo: assignedToName,
          addedAt: existingLead.created_at,
          existingLeadId: existingLead.id,
        },
        { status: 409 }
      )
    }
  }

  const aiTimer = createAPITimer()
  let aiResult
  try {
    aiResult = await analyzeChannel(ytData)
    // Log successful Groq AI API call
    logAPIUsage({
      apiName: 'groq',
      userId: user.id,
      endpoint: 'chat.completions',
      status: 'success',
      quotaUnitsUsed: 1,
      responseTimeMs: aiTimer(),
    }).catch(() => {})
  } catch (err) {
    // Log failed Groq AI API call
    logAPIUsage({
      apiName: 'groq',
      userId: user.id,
      endpoint: 'chat.completions',
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      responseTimeMs: aiTimer(),
    }).catch(() => {})
    throw err
  }
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
      // Group A: computed from video data
      shorts_pct: ytData.shortsPct,
      avg_like_rate_pct: ytData.avgLikeRatePct,
      avg_comment_rate_pct: ytData.avgCommentRatePct,
      avg_duration_sec: ytData.avgDurationSec,
      top_video_title: ytData.topVideoTitle,
      top_video_url: ytData.topVideoUrl,
      top_video_views: ytData.topVideoViews,
      // Group B: from channels.list (already fetched)
      channel_country: ytData.channelCountry,
      channel_keywords: ytData.channelKeywords,
      is_verified: ytData.isVerified,
      // Group C: promoted from socialLinks
      tiktok: ytData.tiktok,
      linkedin: ytData.linkedin,
      facebook: ytData.facebook,
      merch: ytData.merch,
      // Group D: community posts
      has_community_posts: ytData.hasCommunityPosts,
      // Group E: AI-generated
      ai_red_flags: analysis.ai_red_flags,
      ai_confidence_reason: analysis.ai_confidence_reason,
      outreach_email_draft: analysis.outreach_email_draft,
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
