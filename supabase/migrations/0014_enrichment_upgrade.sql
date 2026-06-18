-- 0014_enrichment_upgrade.sql
-- Add 15 new enrichment fields to leads table

ALTER TABLE leads
  -- Group A: computed from video data
  ADD COLUMN shorts_pct numeric(5,2) NULL,
  ADD COLUMN avg_like_rate_pct numeric(6,3) NULL,
  ADD COLUMN avg_comment_rate_pct numeric(6,3) NULL,
  ADD COLUMN avg_duration_sec integer NULL,
  ADD COLUMN top_video_title text NULL,
  ADD COLUMN top_video_url text NULL,
  ADD COLUMN top_video_views integer NULL,

  -- Group B: from channels.list (already fetched)
  ADD COLUMN channel_country text NULL,
  ADD COLUMN channel_keywords text[] NULL,
  ADD COLUMN is_verified boolean NULL,

  -- Group C: promoted from socialLinks
  ADD COLUMN tiktok text NULL,
  ADD COLUMN linkedin text NULL,
  ADD COLUMN facebook text NULL,

  -- Group D: community posts
  ADD COLUMN has_community_posts boolean NULL,

  -- Group E: AI-generated
  ADD COLUMN ai_red_flags text[] NULL,
  ADD COLUMN ai_confidence_reason text NULL,
  ADD COLUMN outreach_email_draft text NULL;

COMMENT ON COLUMN leads.shorts_pct IS 'Percentage of recent videos that are YouTube Shorts (duration < 60s)';
COMMENT ON COLUMN leads.avg_like_rate_pct IS 'Average like rate across last 10 videos: likes/views*100';
COMMENT ON COLUMN leads.avg_comment_rate_pct IS 'Average comment rate across last 10 videos: comments/views*100';
COMMENT ON COLUMN leads.avg_duration_sec IS 'Average video duration in seconds across last 10 videos';
COMMENT ON COLUMN leads.top_video_title IS 'Title of the highest-viewed video from recent fetch';
COMMENT ON COLUMN leads.top_video_url IS 'YouTube URL of the highest-viewed video from recent fetch';
COMMENT ON COLUMN leads.top_video_views IS 'View count of the highest-viewed recent video';
COMMENT ON COLUMN leads.channel_country IS 'Creator declared country from YouTube channel data';
COMMENT ON COLUMN leads.channel_keywords IS 'Creator own channel tags from YouTube branding settings';
COMMENT ON COLUMN leads.is_verified IS 'Whether this channel has a verified/linked status on YouTube';
COMMENT ON COLUMN leads.tiktok IS 'TikTok profile URL (scraped from YouTube About page)';
COMMENT ON COLUMN leads.linkedin IS 'LinkedIn profile URL (scraped from YouTube About page)';
COMMENT ON COLUMN leads.facebook IS 'Facebook page URL (scraped from YouTube About page)';
COMMENT ON COLUMN leads.has_community_posts IS 'Whether the channel actively uses YouTube Community posts';
COMMENT ON COLUMN leads.ai_red_flags IS 'AI-detected warning signals with evidence';
COMMENT ON COLUMN leads.ai_confidence_reason IS 'AI explanation of why confidence is low/medium/high';
COMMENT ON COLUMN leads.outreach_email_draft IS 'AI-generated personalised cold email draft for this creator';
