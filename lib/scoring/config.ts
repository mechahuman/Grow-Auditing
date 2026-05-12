// Scoring thresholds — edit this file to tune the rubric without touching logic.
// Currently all factors contribute equally (weight: 1.0).
// Add per-factor weights here if needed in v2.

export const SUB_RANGE_TIERS = [
  { min: 0,    max: 999,        score: 0 },
  { min: 1000, max: 4999,       score: 0.5 },
  { min: 5000, max: Infinity,   score: 1 },
] as const

export const S2V_THRESHOLD_PCT = 10  // avg_views / subscribers * 100 must be >= this

export const SCORE_LABELS = [
  { min: 4.0, max: 5.0, label: 'Strong fit', color: 'green' },
  { min: 3.0, max: 3.9, label: 'Solid fit',  color: 'blue'  },
  { min: 2.0, max: 2.9, label: 'Weak fit',   color: 'yellow'},
  { min: 1.0, max: 1.9, label: 'Poor fit',   color: 'red'   },
] as const

export type ScoreLabel = 'Strong fit' | 'Solid fit' | 'Weak fit' | 'Poor fit'
export type ScoreColor = 'green' | 'blue' | 'yellow' | 'red'
