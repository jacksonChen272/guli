import { describe, expect, it } from 'vitest'
import { filterScreenerResults, searchScreenerResults } from '../screener/ScreenerFilterService'
import { paginateScreenerResults, rankScreenerResults } from '../screener/ScreenerRankingService'
import { exportScreenerCsv, summarizePreset } from '../screener/ScreenerSummaryService'
import type { ScreenerResult } from '../../types/screener'

const row = (symbol: string, patch: Partial<ScreenerResult> = {}): ScreenerResult => ({ symbol, name: symbol === '2330' ? '台積電' : '測試股', tradeDate: '2026-07-16', presetId: 'strong-trend', matched: true, rank: 0, score: 70, confidence: 80, technicalScore: 70, decisionScore: 65, healthScore: 60, snapshotScore: 55, close: 100, changePercent: 1, rsi14: 60, macdHistogram: 1, volumeRatio: 2, aboveMa20: true, aboveMa60: true, k: 60, d: 50, return20: 5, return60: 10, volatility20: 20, historyRecordCount: 300, stale: false, dateAlignmentStatus: 'aligned', institutionalNet: 100, riskLevel: 'low', reasons: ['收盤高於 MA20'], risks: [], matchedRules: ['close > MA20'], missingFields: [], sourceSummary: ['TWSE Official History'], warnings: [], ...patch })
const rows = [row('2330'), row('2603', { technicalScore: 85, confidence: 70, riskLevel: 'high', institutionalNet: -100, aboveMa20: false }), row('2317', { technicalScore: 60, confidence: 95, volumeRatio: 1.2, rsi14: 45 })]

describe('選股搜尋、篩選、排序、分頁與 CSV', () => {
  it('依代號搜尋', () => expect(searchScreenerResults(rows, '2330')).toHaveLength(1))
  it('依名稱搜尋', () => expect(searchScreenerResults(rows, '台積')).toHaveLength(1))
  it('依規則文字搜尋', () => expect(searchScreenerResults(rows, 'MA20')).toHaveLength(3))
  it('空搜尋保留全部', () => expect(searchScreenerResults(rows, '')).toHaveLength(3))
  it('Technical 最低分篩選', () => expect(filterScreenerResults(rows, { technicalScoreMin: 80 })).toHaveLength(1))
  it('RSI 範圍篩選', () => expect(filterScreenerResults(rows, { rsiMin: 50, rsiMax: 65 })).toHaveLength(2))
  it('量比篩選', () => expect(filterScreenerResults(rows, { volumeRatioMin: 1.5 })).toHaveLength(2))
  it('MA20 狀態篩選', () => expect(filterScreenerResults(rows, { aboveMa20: true })).toHaveLength(2))
  it('法人買超篩選', () => expect(filterScreenerResults(rows, { institutionalState: 'buy' })).toHaveLength(2))
  it('排除高風險', () => expect(filterScreenerResults(rows, { excludeHighRisk: true })).toHaveLength(2))
  it('依 Technical 降冪並產生排名', () => expect(rankScreenerResults(rows)[0].symbol).toBe('2603'))
  it('依 Confidence 降冪', () => expect(rankScreenerResults(rows, 'confidence')[0].symbol).toBe('2317'))
  it('每頁 25 筆', () => expect(paginateScreenerResults(Array.from({ length: 60 }, (_, index) => row(String(1000 + index))), 2).rows).toHaveLength(25))
  it('超出頁碼會校正', () => expect(paginateScreenerResults(rows, 99).page).toBe(1))
  it('CSV 包含 BOM 以外的繁中標頭內容', () => expect(exportScreenerCsv(rows)).toContain('Technical Score'))
  it('CSV 正確處理逗號', () => expect(exportScreenerCsv([row('2330', { name: '台積,電' })])).toContain('"台積,電"'))
  it('Preset 摘要計算符合數量', () => expect(summarizePreset('strong-trend', rows, 3).matchedCount).toBe(3))
})
