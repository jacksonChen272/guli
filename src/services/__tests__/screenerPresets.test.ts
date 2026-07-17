import { describe, expect, it } from 'vitest'
import { evaluateScreenerPreset } from '../screener/ScreenerRuleEngine'
import type { ScreenerEvaluationContext, TechnicalIndexEntry } from '../../types/screener'

const technical = (patch: Partial<TechnicalIndexEntry> = {}): TechnicalIndexEntry => ({ symbol: '2330', name: '台積電', tradeDate: '2026-07-16', historyRecordCount: 300, close: 110, change: 2, changePercent: 1.85, volume: 2500, averageVolume20: 1000, volumeRatio: 2.5, ma5: 108, ma10: 105, ma20: 100, ma60: 90, ma120: 80, rsi14: 62, k: 70, d: 60, macd: 3, macdSignal: 2, macdHistogram: 1, bollingerUpper: 120, bollingerMiddle: 100, bollingerLower: 80, atr14: 2, return20: 12, return60: 20, volatility20: 18, aboveMa20: true, aboveMa60: true, ma20Slope: 2, ma60Slope: 1, macdCrossDays: 1, kdImproving: true, signalIds: [], technicalScore: 78, technicalConfidence: 100, technicalLabel: '偏強', riskLevel: 'low', source: 'TWSE Official History', status: 'official', warnings: [], ...patch })
const context = (patch: Partial<ScreenerEvaluationContext> = {}): ScreenerEvaluationContext => ({ technical: technical(), decisionScore: 76, healthScore: 70, snapshotScore: 75, institutionalNet: 100000, institutionalTradeDate: '2026-07-16', snapshotTradeDate: '2026-07-16', decisionTradeDate: '2026-07-16', dateAlignment: { status: 'aligned', referenceDate: '2026-07-16', maxTradingDayGap: 0, confidencePenalty: 0, reasons: [] }, sampleVolatilityMedian: 25, ...patch })

describe('十種 Preset 固定規則', () => {
  it('強勢趨勢正例', () => expect(evaluateScreenerPreset('strong-trend', context()).matched).toBe(true))
  it('強勢趨勢拒絕過熱 RSI', () => expect(evaluateScreenerPreset('strong-trend', context({ technical: technical({ rsi14: 82 }) })).matched).toBe(false))
  it('突破量增正例', () => expect(evaluateScreenerPreset('breakout-volume', context()).matched).toBe(true))
  it('突破量增拒絕量比不足', () => expect(evaluateScreenerPreset('breakout-volume', context({ technical: technical({ volumeRatio: 1.2 }) })).matched).toBe(false))
  it('MACD 黃金交叉正例', () => expect(evaluateScreenerPreset('macd-golden-cross', context()).matched).toBe(true))
  it('MACD 黃金交叉拒絕超過三日', () => expect(evaluateScreenerPreset('macd-golden-cross', context({ technical: technical({ macdCrossDays: 4 }) })).matched).toBe(false))
  it('法人技術同步正例', () => expect(evaluateScreenerPreset('institution-technical', context()).matched).toBe(true))
  it('法人技術同步拒絕法人賣超', () => expect(evaluateScreenerPreset('institution-technical', context({ institutionalNet: -1 })).matched).toBe(false))
  it('法人技術同步拒絕日期 mismatch', () => expect(evaluateScreenerPreset('institution-technical', context({ dateAlignment: { status: 'mismatched', referenceDate: '2026-07-16', maxTradingDayGap: 3, confidencePenalty: 20, reasons: [] } })).matched).toBe(false))
  it('超跌反彈正例', () => expect(evaluateScreenerPreset('oversold-rebound', context({ technical: technical({ rsi14: 30, close: 82, bollingerLower: 80, kdImproving: true }) })).matched).toBe(true))
  it('超跌反彈拒絕嚴重跌破下軌', () => expect(evaluateScreenerPreset('oversold-rebound', context({ technical: technical({ rsi14: 30, close: 70, bollingerLower: 80 }) })).matched).toBe(false))
  it('低波動趨勢正例', () => expect(evaluateScreenerPreset('low-volatility-trend', context()).matched).toBe(true))
  it('低波動趨勢拒絕高於中位數', () => expect(evaluateScreenerPreset('low-volatility-trend', context({ technical: technical({ volatility20: 40 }) })).matched).toBe(false))
  it('高成交動能正例', () => expect(evaluateScreenerPreset('high-volume-momentum', context()).matched).toBe(true))
  it('高成交動能拒絕負報酬', () => expect(evaluateScreenerPreset('high-volume-momentum', context({ technical: technical({ return20: -1 }) })).matched).toBe(false))
  it('防守型觀察正例', () => expect(evaluateScreenerPreset('defensive-watch', context()).matched).toBe(true))
  it('防守型觀察拒絕 RSI 過高', () => expect(evaluateScreenerPreset('defensive-watch', context({ technical: technical({ rsi14: 70 }) })).matched).toBe(false))
  it('高風險警示由 RSI 觸發', () => expect(evaluateScreenerPreset('high-risk-warning', context({ technical: technical({ rsi14: 80 }) })).matched).toBe(true))
  it('高風險警示由法人賣超觸發', () => expect(evaluateScreenerPreset('high-risk-warning', context({ institutionalNet: -100 })).matched).toBe(true))
  it('低風險不進高風險警示', () => expect(evaluateScreenerPreset('high-risk-warning', context()).matched).toBe(false))
  it('資料完整精選正例', () => expect(evaluateScreenerPreset('complete-data', context()).matched).toBe(true))
  it('資料不足 250 日不入選', () => expect(evaluateScreenerPreset('complete-data', context({ technical: technical({ historyRecordCount: 249 }) })).matched).toBe(false))
  it('stale 不入資料完整精選', () => expect(evaluateScreenerPreset('complete-data', context({ technical: technical({ status: 'stale' }) })).matched).toBe(false))
  it('日期扣分只影響 Confidence', () => { const aligned = evaluateScreenerPreset('strong-trend', context()); const mismatch = evaluateScreenerPreset('strong-trend', context({ dateAlignment: { status: 'mismatched', referenceDate: '2026-07-16', maxTradingDayGap: 3, confidencePenalty: 20, reasons: [] } })); expect(mismatch.technicalScore).toBe(aligned.technicalScore); expect(mismatch.confidence).toBeLessThan(aligned.confidence) })
})
