import type { YouTubeEnrichmentResult } from '../youtube/types'
import type { ChannelAnalysis, AnalysisResult } from './types'
import { callAI } from './client'
import { SYSTEM_PROMPT } from './systemPrompt'
import { buildUserPrompt } from './promptBuilder'

function validateAnalysis(raw: unknown): ChannelAnalysis {
  const r = (raw ?? {}) as Record<string, unknown>

  const confidence = r.ai_confidence
  const validConfidence: ChannelAnalysis['ai_confidence'] =
    confidence === 'low' || confidence === 'medium' || confidence === 'high'
      ? confidence
      : 'low'

  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []

  return {
    category:              typeof r.category === 'string'              ? r.category              : 'Unknown',
    content_style:         typeof r.content_style === 'string'         ? r.content_style         : 'Unknown',
    monetization:          typeof r.monetization === 'string'          ? r.monetization          : 'Not visible',
    posting_pattern:       typeof r.posting_pattern === 'string'       ? r.posting_pattern       : 'Unknown',
    strengths:             toStringArray(r.strengths),
    concerns:              toStringArray(r.concerns),
    remarks_draft:         typeof r.remarks_draft === 'string'         ? r.remarks_draft         : '',
    ai_confidence:         validConfidence,
    data_gaps:             toStringArray(r.data_gaps),
    ai_red_flags:          toStringArray(r.ai_red_flags),
    ai_confidence_reason:  typeof r.ai_confidence_reason === 'string'  ? r.ai_confidence_reason  : '',
    outreach_email_draft:  typeof r.outreach_email_draft === 'string'  ? r.outreach_email_draft  : '',
    niche:                 typeof r.niche === 'string'                 ? r.niche                 : 'Others',
    niche_custom:          typeof r.niche_custom === 'string'          ? r.niche_custom          : null,
  }
}

export async function analyzeChannel(
  data: YouTubeEnrichmentResult
): Promise<AnalysisResult> {
  const userPrompt = buildUserPrompt(data)

  let rawResponse = ''
  let enrichmentPartial = false

  try {
    rawResponse = await callAI(SYSTEM_PROMPT, userPrompt)
  } catch (err) {
    // Retry once on network/timeout errors
    try {
      rawResponse = await callAI(SYSTEM_PROMPT, userPrompt)
    } catch {
      console.error('AI call failed after retry:', err)
      return {
        analysis: validateAnalysis({}),
        raw_response: '',
        enrichment_partial: true,
      }
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawResponse)
  } catch {
    // Retry once if JSON is invalid
    try {
      rawResponse = await callAI(SYSTEM_PROMPT, userPrompt)
      parsed = JSON.parse(rawResponse)
    } catch {
      console.error('AI returned invalid JSON after retry. Raw:', rawResponse)
      enrichmentPartial = true
      parsed = {}
    }
  }

  return {
    analysis: validateAnalysis(parsed),
    raw_response: rawResponse,
    enrichment_partial: enrichmentPartial,
  }
}
