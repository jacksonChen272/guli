import { describe, expect, it } from 'vitest'
import type { SupportResistanceAnalysis } from '../../../types/supportResistance'
import { buildLevelInsight, buildPricePositionModel } from '../StockKeyLevelsCard'

const analysis = {
  currentPrice: 100,
  supports: [{ center: 90, distancePercent: -10 }],
  resistances: [{ center: 110, distancePercent: 10 }],
} as unknown as SupportResistanceAnalysis

describe('StockKeyLevelsCard', () => {
  it('uses existing support and resistance distances in the explanation', () => {
    expect(buildLevelInsight(analysis)).toContain('10.00%')
  })

  it('does not invent levels when the existing analysis has none', () => {
    expect(buildLevelInsight({
      supports: [],
      resistances: [],
    } as unknown as SupportResistanceAnalysis)).toContain('沒有足夠')
  })

  it('maps current price into the existing support-resistance interval', () => {
    expect(buildPricePositionModel(analysis)?.positionPercent).toBe(50)
  })
})
