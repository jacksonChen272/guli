import { describe, expect, it } from 'vitest'
import type { StockRiskAssessmentInput } from '../../../types/stockRiskAssessment'
import { assessStockRisks } from '../StockRiskAssessmentService'

const input = (overrides: Partial<StockRiskAssessmentInput> = {}): StockRiskAssessmentInput => ({ tradeDate: '2026-07-16', close: 100, rsi14: 55, k: 50, d: 45, atr14: 2, volatility20: 20, volumeRatio: 1, ma20: 95, ma60: 90, nearestResistanceDistancePercent: 5, institutionalNetShares: 10, industryStrength: 60, decisionScore: 70, technicalScore: 72, dateMismatch: false, stale: false, historyRecordCount: 250, ...overrides })

describe('stock-risk-v1.0', () => {
  it('returns no risks for a balanced complete sample', () => expect(assessStockRisks(input())).toEqual([]))
  it('triggers RSI overheated risk', () => expect(assessStockRisks(input({ rsi14: 80 })).some((risk) => risk.id === 'rsi-overheated')).toBe(true))
  it('raises RSI severity at the higher threshold', () => expect(assessStockRisks(input({ rsi14: 85 })).find((risk) => risk.id === 'rsi-overheated')?.severity).toBe('high'))
  it('triggers KD high-level weakening', () => expect(assessStockRisks(input({ k: 78, d: 82 })).some((risk) => risk.id === 'kd-turning')).toBe(true))
  it('triggers high ATR relative to price', () => expect(assessStockRisks(input({ atr14: 5 })).some((risk) => risk.id === 'atr-high')).toBe(true))
  it('triggers high volatility', () => expect(assessStockRisks(input({ volatility20: 40 })).some((risk) => risk.id === 'volatility-high')).toBe(true))
  it('triggers abnormal volume', () => expect(assessStockRisks(input({ volumeRatio: 2.5 })).some((risk) => risk.id === 'abnormal-volume')).toBe(true))
  it('triggers low volume', () => expect(assessStockRisks(input({ volumeRatio: .4 })).some((risk) => risk.id === 'low-volume')).toBe(true))
  it('triggers nearby resistance', () => expect(assessStockRisks(input({ nearestResistanceDistancePercent: 1.2 })).some((risk) => risk.id === 'near-resistance')).toBe(true))
  it('triggers below MA20', () => expect(assessStockRisks(input({ close: 90, ma20: 95 })).some((risk) => risk.id === 'below-ma20')).toBe(true))
  it('triggers below MA60 as high severity', () => expect(assessStockRisks(input({ close: 80, ma60: 90 })).find((risk) => risk.id === 'below-ma60')?.severity).toBe('high'))
  it('triggers official institutional sell risk', () => expect(assessStockRisks(input({ institutionalNetShares: -1 })).some((risk) => risk.id === 'institutional-sell')).toBe(true))
  it('triggers weak industry risk', () => expect(assessStockRisks(input({ industryStrength: 40 })).some((risk) => risk.id === 'industry-weak')).toBe(true))
  it('triggers Decision/Technical mismatch', () => expect(assessStockRisks(input({ decisionScore: 80, technicalScore: 50 })).some((risk) => risk.id === 'score-mismatch')).toBe(true))
  it('triggers date mismatch as high severity', () => expect(assessStockRisks(input({ dateMismatch: true })).find((risk) => risk.id === 'date-mismatch')?.severity).toBe('high'))
  it('triggers stale data as high severity', () => expect(assessStockRisks(input({ stale: true })).find((risk) => risk.id === 'stale-data')?.severity).toBe('high'))
  it('triggers insufficient history below 60 days', () => expect(assessStockRisks(input({ historyRecordCount: 40 })).some((risk) => risk.id === 'insufficient-history')).toBe(true))
  it('sorts high severity before medium severity', () => { const result = assessStockRisks(input({ stale: true, volumeRatio: .4 })); expect(result[0].severity).toBe('high') })
  it('retains trade date and formula version', () => { const risk = assessStockRisks(input({ stale: true }))[0]; expect(risk.tradeDate).toBe('2026-07-16'); expect(risk.formulaVersion).toBe('stock-risk-v1.0') })
  it('never uses missing values as zero', () => expect(assessStockRisks(input({ close: null, rsi14: null, atr14: null, ma20: null, ma60: null }))).toEqual([]))
})
