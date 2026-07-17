import { describe, expect, it } from 'vitest'
import { classifyTechnicalScore, technicalScoreWeights } from '../../config/technicalScoreFormula'
import { calculateTechnicalScore } from '../technical/TechnicalScoreService'
import type { TechnicalIndexEntry } from '../../types/screener'

const entry = (patch: Partial<TechnicalIndexEntry> = {}): TechnicalIndexEntry => ({ symbol: '2330', name: '台積電', tradeDate: '2026-07-16', historyRecordCount: 300, close: 110, change: 2, changePercent: 1.85, volume: 2000, averageVolume20: 1000, volumeRatio: 2, ma5: 108, ma10: 106, ma20: 100, ma60: 90, ma120: 85, rsi14: 62, k: 70, d: 60, macd: 3, macdSignal: 2, macdHistogram: 1, bollingerUpper: 115, bollingerMiddle: 100, bollingerLower: 85, atr14: 2, return20: 12, return60: 20, volatility20: 20, aboveMa20: true, aboveMa60: true, ma20Slope: 3, ma60Slope: 2, macdCrossDays: 1, kdImproving: true, signalIds: [], technicalScore: null, technicalConfidence: 0, technicalLabel: '資料不足', riskLevel: 'low', source: 'TWSE Official History', status: 'official', warnings: [], ...patch })

describe('Technical Score technical-v1.0', () => {
  it('權重合計固定為 100%', () => expect(Object.values(technicalScoreWeights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1))
  it('強勢結構產生高分', () => expect(calculateTechnicalScore(entry()).score).toBeGreaterThanOrEqual(70))
  it('弱勢結構低於強勢結構', () => expect(calculateTechnicalScore(entry({ close: 75, ma5: 77, ma20: 90, ma60: 100, aboveMa20: false, aboveMa60: false, ma20Slope: -3, ma60Slope: -2, rsi14: 38, k: 30, d: 45, return20: -15, macd: -3, macdSignal: -1, macdHistogram: -2 })).score).toBeLessThan(calculateTechnicalScore(entry()).score!))
  it('高波動降低風險控制分數', () => { const normal = calculateTechnicalScore(entry()); const risky = calculateTechnicalScore(entry({ volatility20: 70, atr14: 8, rsi14: 82 })); expect(risky.factors.find((factor) => factor.id === 'risk')!.score).toBeLessThan(normal.factors.find((factor) => factor.id === 'risk')!.score!) })
  it('所有分數限制在 0–100', () => expect(calculateTechnicalScore(entry({ return20: 999, macdHistogram: 999 })).score).toBeLessThanOrEqual(100))
  it('缺值不會以零補值', () => expect(calculateTechnicalScore(entry({ rsi14: null, k: null, d: null, return20: null })).factors.find((factor) => factor.id === 'momentum')!.score).toBeNull())
  it('可用權重重新正規化', () => { const result = calculateTechnicalScore(entry({ rsi14: null, k: null, d: null, return20: null })); expect(result.factors.reduce((sum, factor) => sum + factor.normalizedWeight, 0)).toBeCloseTo(1) })
  it('可用權重低於 50% 時為 null', () => { const sparse = entry({ close: null, changePercent: null, ma5: null, ma20: null, ma60: null, ma20Slope: null, ma60Slope: null, rsi14: null, k: null, d: null, return20: null, volumeRatio: null, macd: null, macdSignal: null, macdHistogram: null, bollingerUpper: null, bollingerLower: null, volatility20: null, atr14: null, aboveMa20: null, aboveMa60: null }); expect(calculateTechnicalScore(sparse).score).toBeNull() })
  it('Confidence 與分數分開', () => { const result = calculateTechnicalScore(entry({ rsi14: null, k: null, d: null, return20: null })); expect(result.confidence).toBe(80); expect(result.score).not.toBe(result.confidence) })
  it('相同輸入產生相同輸出', () => expect(calculateTechnicalScore(entry())).toEqual(calculateTechnicalScore(entry())))
  it.each([[90, '強勢'], [70, '偏強'], [55, '中性'], [40, '偏弱'], [20, '弱勢'], [null, '資料不足']] as const)('分級 %s → %s', (score, label) => expect(classifyTechnicalScore(score)).toBe(label))
  it('公式版本固定', () => expect(calculateTechnicalScore(entry()).formulaVersion).toBe('technical-v1.0'))
  it('Contribution 合計等於總分', () => { const result = calculateTechnicalScore(entry()); expect(result.factors.reduce((sum, factor) => sum + (factor.contribution ?? 0), 0)).toBeCloseTo(result.score!, 0) })
})
