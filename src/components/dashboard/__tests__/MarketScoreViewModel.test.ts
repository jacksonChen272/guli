import { describe, expect, it } from 'vitest'
import { buildMarketScoreViewModel, sentimentInterval } from '../../../services/dashboard/MarketScoreViewModel'
import { marketFixture, sentimentFixture } from './dashboardFixtures'

describe('MarketScoreViewModel', () => {
  it.each([
    [19.9, '0–未滿 20'],
    [20, '20–未滿 40'],
    [39.9, '20–未滿 40'],
    [40, '40–未滿 60'],
    [59.9, '40–未滿 60'],
    [60, '60–未滿 80'],
    [79.9, '60–未滿 80'],
    [80, '80–100'],
    [100, '80–100'],
  ])('uses explicit sentiment interval boundary %s', (score, interval) => {
    expect(sentimentInterval(score)).toBe(interval)
  })

  it('separates trend, sentiment, and breadth semantics', () => {
    const model = buildMarketScoreViewModel({
      decision: null,
      sentiment: sentimentFixture,
      market: marketFixture,
    })
    expect(model.trend.direction).toBe('unknown')
    expect(model.sentiment.score).toBe(68.5)
    expect(model.breadth.label).toBe('偏多')
    expect(model.breadth.advanceRatio).toBeCloseTo(620 / 1030 * 100)
  })

  it('does not emit NaN when breadth is missing', () => {
    const model = buildMarketScoreViewModel({
      decision: null,
      sentiment: { ...sentimentFixture, score: null },
      market: { ...marketFixture, advanceCount: null, declineCount: null, unchangedCount: null },
    })
    expect(model.sentiment.interval).toBe('資料不足')
    expect(model.breadth.advanceRatio).toBeNull()
    expect(JSON.stringify(model)).not.toContain('NaN')
  })
})
