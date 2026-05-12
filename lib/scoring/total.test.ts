// Unit tests for the scoring module.
// The two worked examples below come directly from docs/03-scoring-rubric.md
// and are the source of truth for the formula. If these break, the formula is wrong.

import { computeLeadScore } from './index'

// Example 1 from spec: 5k subs, 800 avg views, G-Factor 4 → 4.3
// Note: with updated Sub Range tiers (5k+ = 1.0), 5,000 subs hits the full-score tier
test('spec example 1: 5k subs, 800 avg views, G-Factor 4 → 4.8', () => {
  const result = computeLeadScore({
    hasYouTube: true,
    subscriberCount: 5000,
    avgViewsLast10: 800,
    gFactor: 4,
  })
  expect(result.ytScoreFactor).toBe(1)
  expect(result.subRangeFactor).toBe(1)       // 5000 hits 5k+ tier (updated threshold)
  expect(result.s2vFactor).toBe(1)            // 800/5000 = 16% >= 10%
  expect(result.s2vRatioPct).toBe(16)
  expect(result.gFactorNormalized).toBe(0.75)
  expect(result.leadScoreTotal).toBe(4.8)     // 1 + (1+1+1+0.75) = 4.75 → 4.8
  expect(result.label).toBe('Strong fit')
  expect(result.color).toBe('green')
})

// Example 2 from spec: 200 subs, 15 avg views, G-Factor 2 → 2.3
test('spec example 2: 200 subs, 15 avg views, G-Factor 2 → 2.3', () => {
  const result = computeLeadScore({
    hasYouTube: true,
    subscriberCount: 200,
    avgViewsLast10: 15,
    gFactor: 2,
  })
  expect(result.ytScoreFactor).toBe(1)
  expect(result.subRangeFactor).toBe(0)       // 200 < 1k
  expect(result.s2vFactor).toBe(0)            // 15/200 = 7.5% < 10%
  expect(result.s2vRatioPct).toBe(7.5)
  expect(result.gFactorNormalized).toBe(0.25)
  expect(result.leadScoreTotal).toBe(2.3)     // 1 + (1+0+0+0.25) = 2.25 → 2.3
  expect(result.label).toBe('Weak fit')
  expect(result.color).toBe('yellow')
})

// Edge cases
test('no YouTube → score 1.0 minimum', () => {
  const result = computeLeadScore({
    hasYouTube: false,
    subscriberCount: 0,
    avgViewsLast10: null,
    gFactor: 1,
  })
  expect(result.leadScoreTotal).toBe(1)
  expect(result.label).toBe('Poor fit')
})

test('null avgViews → s2vFactor 0, ratioPct null', () => {
  const result = computeLeadScore({
    hasYouTube: true,
    subscriberCount: 10000,
    avgViewsLast10: null,
    gFactor: 3,
  })
  expect(result.s2vFactor).toBe(0)
  expect(result.s2vRatioPct).toBeNull()
})

test('mid-tier subs (1k–4,999) → subRangeFactor 0.5', () => {
  const result = computeLeadScore({
    hasYouTube: true,
    subscriberCount: 2500,
    avgViewsLast10: 100,
    gFactor: 3,
  })
  expect(result.subRangeFactor).toBe(0.5)
})

test('perfect score → 5.0', () => {
  const result = computeLeadScore({
    hasYouTube: true,
    subscriberCount: 10000,
    avgViewsLast10: 2000,  // 20% ratio
    gFactor: 5,
  })
  expect(result.leadScoreTotal).toBe(5)
  expect(result.label).toBe('Strong fit')
})
