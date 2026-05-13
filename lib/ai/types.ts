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
}

export interface AnalysisResult {
  analysis: ChannelAnalysis
  raw_response: string
  enrichment_partial: boolean
}
