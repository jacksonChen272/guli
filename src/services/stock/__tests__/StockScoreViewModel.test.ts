import { describe, expect, it } from 'vitest'
import type { StockAnalysisData } from '../../../hooks/useStockAnalysisData'
import { buildStockCommandViewModel, buildStockDataStatusViewModel, buildStockScoreViewModel, getRiskSeverity } from '../StockScoreViewModel'

const baseData = (overrides: Partial<StockAnalysisData> = {}) => ({
  status: 'success',
  stock: null,
  quote: { tradeDate: '2026-07-24', close: 100, change: 1, warnings: [] },
  history: { status: 'official', recordCount: 250, lastTradeDate: '2026-07-24', warnings: [] },
  technicalIndex: { technicalScore: 78, technicalConfidence: 84, technicalLabel: '偏強', riskLevel: 'low', status: 'official', tradeDate: '2026-07-24', warnings: [] },
  decision: { score: 82, confidence: 88, label: '極強', summary: '規則摘要', tradeDate: '2026-07-24', trace: { formulaVersion: 'decision-v1.0' }, warnings: [] },
  snapshot: { snapshotScore: 75, status: '偏強', tradeDate: '2026-07-24', warnings: [] },
  institutional: { record: { totalNetShares: 12000, tradeDate: '2026-07-24', warnings: [] }, netVolumePercent: 1.2, percentile: 80 },
  industryMapping: { industryName: '半導體', updatedAt: '2026-07-24T08:00:00Z' },
  industrySnapshot: null,
  errors: [],
  warnings: [],
  name: '測試股',
  historyUrl: '/guli/data/test.json',
  health: { totalScore: 72, summary: '健康摘要' },
  indicators: null,
  priceStructure: { trend: { classification: '偏多結構' } },
  narrative: { headline: '今日維持偏多結構', stance: '偏多', confidence: 82, positiveFactors: [{ explanation: '價格站上月線' }], riskFactors: [{ explanation: '接近壓力區' }], tradeDate: '2026-07-24' },
  risks: [],
  dateConsistency: { status: 'aligned', referenceDate: '2026-07-24', dates: [], mismatched: false },
  stale: false,
  isWatchlisted: false,
  toggleWatchlist: () => undefined,
  reload: () => undefined,
  ...overrides,
}) as unknown as StockAnalysisData

describe('StockScoreViewModel', () => {
  it('keeps five independent score or status cards', () => {
    expect(buildStockScoreViewModel(baseData()).map((item) => item.id)).toEqual(['decision', 'technical', 'health', 'risk', 'snapshot'])
  })

  it('does not combine existing scores into a new total', () => {
    const scores = buildStockScoreViewModel(baseData())
    expect(scores.find((item) => item.id === 'decision')?.value).toBe(82)
    expect(scores.find((item) => item.id === 'technical')?.value).toBe(78)
  })

  it('converts non-finite values to missing presentation state', () => {
    const data = baseData({ decision: { ...baseData().decision!, score: Number.NaN } })
    expect(buildStockScoreViewModel(data)[0].valueLabel).toBe('尚未取得')
  })

  it('uses existing risk rules instead of calculating a risk score', () => {
    const data = baseData({ risks: [{ severity: 'high' }] as StockAnalysisData['risks'] })
    expect(getRiskSeverity(data)).toBe('high')
    expect(buildStockScoreViewModel(data).find((item) => item.id === 'risk')?.value).toBeNull()
  })

  it('builds the command center from existing narrative and statuses', () => {
    const model = buildStockCommandViewModel(baseData())
    expect(model.headline).toBe('今日維持偏多結構')
    expect(model.institutional).toContain('買超')
    expect(model.positiveFactors).toEqual(['價格站上月線'])
  })

  it('reports missing data explicitly', () => {
    const model = buildStockDataStatusViewModel(baseData({ quote: null, snapshot: null }))
    expect(model.find((item) => item.id === 'quote')?.statusLabel).toBe('Missing')
    expect(model.find((item) => item.id === 'snapshot')?.detail).toContain('尚未')
  })
})
