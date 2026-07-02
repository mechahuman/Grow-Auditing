export interface ChannelAnalysis {
  category: string
  content_style: string
  monetization: string
  posting_pattern: string
  strengths: string[]
  concerns: string[]
  remarks_draft: string
  ai_confidence: 'low' | 'medium' | 'high'
  data_gaps: string[]
  ai_red_flags: string[]
  ai_confidence_reason: string
  outreach_email_draft: string
  niche: string
  niche_custom: string | null
}

export interface AnalysisResult {
  analysis: ChannelAnalysis
  raw_response: string
  enrichment_partial: boolean
}
