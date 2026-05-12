import { SCORE_LABELS, ScoreLabel, ScoreColor } from './config'

// Each factor contributes 0–1. They sum to a raw total of 0–4.
// Adding 1 shifts the range to the final 1–5 scale.
export function computeLeadScoreTotal(
  ytFactor: number,
  subRangeFactor: number,
  s2vFactor: number,
  gFactorNormalized: number
): number {
  const raw = ytFactor + subRangeFactor + s2vFactor + gFactorNormalized
  return Math.round((1 + raw) * 10) / 10
}

export function getScoreLabel(score: number): { label: ScoreLabel; color: ScoreColor } {
  for (const band of SCORE_LABELS) {
    if (score >= band.min && score <= band.max) {
      return { label: band.label, color: band.color }
    }
  }
  return { label: 'Poor fit', color: 'red' }
}
