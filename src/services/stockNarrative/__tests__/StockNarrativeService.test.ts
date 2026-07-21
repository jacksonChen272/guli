import { describe, expect, it } from 'vitest'
import type { StockNarrativeInput } from '../../../types/stockNarrative'
import { buildStockNarrativeFactors } from '../StockNarrativeFactorService'
import { generateStockNarrative } from '../StockNarrativeService'

const input = (overrides: Partial<StockNarrativeInput> = {}): StockNarrativeInput => ({ symbol: '2330', name: '台積電', tradeDate: '2026-07-16', decisionScore: 75, technicalScore: 72, healthScore: 70, snapshotScore: 68, close: 100, ma20: 95, ma60: 90, rsi14: 60, macdHistogram: 2, volumeRatio: 1.3, institutionalNetShares: 1_000_000, industryRelativeStrength: 70, highRiskCount: 0, stale: false, ...overrides })

describe('stock-narrative-v1.0', () => {
  it('creates a bullish narrative from consistent positive evidence', () => expect(generateStockNarrative(input()).stance).toBe('偏多'))
  it('creates a bearish narrative from consistent negative evidence', () => expect(generateStockNarrative(input({ decisionScore: 30, technicalScore: 35, healthScore: 40, snapshotScore: 38, close: 80, ma20: 90, ma60: 95, rsi14: 40, macdHistogram: -3, volumeRatio: .5, institutionalNetShares: -1_000_000, industryRelativeStrength: 30 })).stance).toBe('偏空'))
  it('creates a neutral narrative from mixed evidence', () => expect(generateStockNarrative(input({ decisionScore: 52, technicalScore: 50, healthScore: 52, snapshotScore: 50, close: 92, ma20: 95, ma60: 90, rsi14: 50, macdHistogram: 0, volumeRatio: 1, institutionalNetShares: -1, industryRelativeStrength: 50 })).stance).toBe('中性'))
  it('returns insufficient when all inputs are unavailable', () => expect(generateStockNarrative(input({ decisionScore: null, technicalScore: null, healthScore: null, snapshotScore: null, close: null, ma20: null, ma60: null, rsi14: null, macdHistogram: null, volumeRatio: null, institutionalNetShares: null, industryRelativeStrength: null })).stance).toBe('資料不足'))
  it('keeps the formula version stable', () => expect(generateStockNarrative(input()).formulaVersion).toBe('stock-narrative-v1.0'))
  it('includes the stock name in the headline', () => expect(generateStockNarrative(input()).headline).toContain('台積電'))
  it('cites MA20 evidence', () => expect(buildStockNarrativeFactors(input()).find((factor) => factor.code === 'price-ma20')?.explanation).toContain('MA20'))
  it('marks a close below MA60 as negative', () => expect(buildStockNarrativeFactors(input({ close: 80, ma60: 90 })).find((factor) => factor.code === 'price-ma60')?.direction).toBe('negative'))
  it('marks positive official institutional flow as positive', () => expect(buildStockNarrativeFactors(input()).find((factor) => factor.code === 'institutional')?.direction).toBe('positive'))
  it('marks negative official institutional flow as negative', () => expect(buildStockNarrativeFactors(input({ institutionalNetShares: -10 })).find((factor) => factor.code === 'institutional')?.direction).toBe('negative'))
  it('treats overheated RSI as a risk factor', () => expect(generateStockNarrative(input({ rsi14: 82 })).riskFactors.some((factor) => factor.code === 'rsi')).toBe(true))
  it('adds stale warning deterministically', () => expect(generateStockNarrative(input({ stale: true })).warnings).toHaveLength(1))
  it('adds high-risk-count evidence', () => expect(generateStockNarrative(input({ highRiskCount: 2 })).riskFactors.some((factor) => factor.code === 'risk-count')).toBe(true))
  it('caps confidence at 100', () => expect(generateStockNarrative(input()).confidence).toBeLessThanOrEqual(100))
  it.each(['買進', '賣出', '必漲', '保證獲利'])('does not emit prohibited claim %s', (claim) => expect(JSON.stringify(generateStockNarrative(input()))).not.toContain(claim))
})
