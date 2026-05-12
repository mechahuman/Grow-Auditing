import {
  computeYtFactor,
  computeSubRangeFactor,
  computeS2vFactor,
  computeGFactorNormalized,
} from './factors'
import { computeLeadScoreTotal, getScoreLabel } from './total'
import type { ScoreLabel, ScoreColor } from './config'

export interface ScoringInput {
  hasYouTube: boolean
  subscriberCount: number
  avgViewsLast10: number | null
  gFactor: 1 | 2 | 3 | 4 | 5
}

export interface ScoringResult {
  ytScoreFactor: number
  subRangeFactor: number
  s2vFactor: number
  s2vRatioPct: number | null
  gFactorNormalized: number
  leadScoreTotal: number
  label: ScoreLabel
  color: ScoreColor
}

export function computeLeadScore(input: ScoringInput): ScoringResult {
  const ytScoreFactor = computeYtFactor(input.hasYouTube)
  const subRangeFactor = computeSubRangeFactor(input.subscriberCount)
  const { factor: s2vFactor, ratioPct: s2vRatioPct } = computeS2vFactor(
    input.avgViewsLast10,
    input.subscriberCount
  )
  const gFactorNormalized = computeGFactorNormalized(input.gFactor)
  const leadScoreTotal = computeLeadScoreTotal(
    ytScoreFactor,
    subRangeFactor,
    s2vFactor,
    gFactorNormalized
  )
  const { label, color } = getScoreLabel(leadScoreTotal)

  return {
    ytScoreFactor,
    subRangeFactor,
    s2vFactor,
    s2vRatioPct,
    gFactorNormalized,
    leadScoreTotal,
    label,
    color,
  }
}

export { getScoreLabel }
export type { ScoreLabel, ScoreColor }
