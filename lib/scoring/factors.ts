import { SUB_RANGE_TIERS, S2V_THRESHOLD_PCT } from './config'

export function computeYtFactor(hasYouTube: boolean): number {
  return hasYouTube ? 1 : 0
}

export function computeSubRangeFactor(subscriberCount: number): number {
  for (const tier of SUB_RANGE_TIERS) {
    if (subscriberCount >= tier.min && subscriberCount <= tier.max) {
      return tier.score
    }
  }
  return 0
}

export function computeS2vFactor(
  avgViewsLast10: number | null,
  subscriberCount: number
): { factor: number; ratioPct: number | null } {
  if (avgViewsLast10 === null || subscriberCount === 0) {
    return { factor: 0, ratioPct: null }
  }
  const ratioPct = (avgViewsLast10 / subscriberCount) * 100
  return {
    factor: ratioPct >= S2V_THRESHOLD_PCT ? 1 : 0,
    ratioPct: Math.round(ratioPct * 100) / 100,
  }
}

export function computeGFactorNormalized(gFactor: 1 | 2 | 3 | 4 | 5): number {
  const map: Record<number, number> = { 1: 0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1 }
  return map[gFactor]
}
