import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { fetchAllYouTubeData } from '../../../lib/youtube/orchestrator'
import { analyzeChannel } from '../../../lib/ai'
import { computeLeadScore } from '../../../lib/scoring'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { lead_id } = body

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })
    }

    // Authenticate user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch existing lead
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (fetchError || !existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Re-fetch YouTube data
    let ytData
    try {
      ytData = await fetchAllYouTubeData(existingLead.youtube_url)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch YouTube data'
      return NextResponse.json({ error: `YouTube API error: ${errorMessage}` }, { status: 400 })
    }

    // Re-analyze channel
    const aiAnalysis = await analyzeChannel(ytData)

    // Recompute scores
    const scoreResult = computeLeadScore({
      hasYouTube: true,
      subscriberCount: ytData.subscriberCount,
      avgViewsLast10: ytData.avgViewsLast10,
      gFactor: existingLead.g_factor as 1 | 2 | 3 | 4 | 5,
    })

    // Extract contact info (Instagram and Twitter from social links)
    const instagramLink = ytData.socialLinks?.find(l => l.platform.toLowerCase().includes('instagram'))
    const twitterLink = ytData.socialLinks?.find(l => l.platform.toLowerCase().includes('twitter'))
    const instagram = instagramLink?.url || null
    const twitter = twitterLink?.url || null

    // Extract social links
    const tiktok = ytData.tiktok || null
    const linkedin = ytData.linkedin || null
    const facebook = ytData.facebook || null
    const merch = ytData.merch || null

    // Build smart merge payload
    const updatePayload = {
      // Always overwrite with fresh YouTube stats
      subscriber_count: ytData.subscriberCount,
      total_views: ytData.totalViews,
      video_count: ytData.videoCount,
      channel_created_at: ytData.channelCreatedAt.toISOString(),
      last_upload_at: ytData.lastUploadAt?.toISOString() || null,
      avg_views_last_10: ytData.avgViewsLast10,
      s2v_ratio_pct: ytData.s2vRatioPct,
      posting_frequency_30d: ytData.postingFrequency30d,
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
      tiktok,
      linkedin,
      facebook,
      merch,
      // Group D: community posts
      has_community_posts: ytData.hasCommunityPosts,
      raw_youtube_data: {
        recentVideos: ytData.recentVideos.map(v => ({
          title: v.title,
          publishedAt: v.publishedAt.toISOString(),
          viewCount: v.viewCount,
        })),
      },
      raw_ai_response: aiAnalysis.raw_response,

      // Always overwrite with fresh AI analysis (except strengths/concerns which are appended)
      category: aiAnalysis.analysis.category,
      content_style: aiAnalysis.analysis.content_style,
      posting_pattern: aiAnalysis.analysis.posting_pattern,
      monetization: aiAnalysis.analysis.monetization,
      // Append new unique strengths (avoid duplicates)
      strengths: Array.from(new Set([
        ...(existingLead.strengths || []),
        ...aiAnalysis.analysis.strengths.filter((s: string) =>
          !(existingLead.strengths || []).some((existing: string) =>
            existing.toLowerCase() === s.toLowerCase()
          )
        )
      ])),
      // Append new unique concerns (avoid duplicates)
      concerns: Array.from(new Set([
        ...(existingLead.concerns || []),
        ...aiAnalysis.analysis.concerns.filter((c: string) =>
          !(existingLead.concerns || []).some((existing: string) =>
            existing.toLowerCase() === c.toLowerCase()
          )
        )
      ])),
      data_gaps: aiAnalysis.analysis.data_gaps,
      ai_confidence: aiAnalysis.analysis.ai_confidence,
      // Group E: AI-generated
      ai_red_flags: aiAnalysis.analysis.ai_red_flags,
      ai_confidence_reason: aiAnalysis.analysis.ai_confidence_reason,
      outreach_email_draft: aiAnalysis.analysis.outreach_email_draft,
      remarks_ai_draft: aiAnalysis.analysis.remarks_draft,

      // Always overwrite with recomputed scores
      yt_score_factor: scoreResult.ytScoreFactor,
      sub_range_factor: scoreResult.subRangeFactor,
      s2v_factor: scoreResult.s2vFactor,
      lead_score_total: scoreResult.leadScoreTotal,

      // Fill-in-blanks only for contact fields
      ...((!existingLead.email || existingLead.email.trim() === '') && ytData.email ? { email: ytData.email } : {}),
      ...((!existingLead.website || existingLead.website.trim() === '') && ytData.website ? { website: ytData.website } : {}),
      ...((!existingLead.instagram || existingLead.instagram.trim() === '') && instagram ? { instagram } : {}),
      ...((!existingLead.twitter || existingLead.twitter.trim() === '') && twitter ? { twitter } : {}),

      // Re-enrich tracking
      re_enrich_count: (existingLead.re_enrich_count || 0) + 1,
      re_enriched_at: new Date().toISOString(),

      // Channel thumbnail (always overwrite)
      channel_thumbnail_url: ytData.thumbnailUrl,
    }

    // Update lead in database
    const { error: updateError } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', lead_id)

    if (updateError) {
      return NextResponse.json({ error: `Database error: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lead re-enriched successfully',
      re_enrich_count: (existingLead.re_enrich_count || 0) + 1,
    })

  } catch (err: any) {
    console.error('Re-enrich error:', err)
    return NextResponse.json(
      { error: `Internal server error: ${err.message}` },
      { status: 500 }
    )
  }
}
