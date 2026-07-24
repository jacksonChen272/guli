import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ScreenerResult } from '../../../types/screener'
import { selectTechnicalOpportunities } from '../TodayOpportunitiesSection'

const result = (symbol: string, rank: number, matched = true): ScreenerResult => ({
  symbol,
  name: `股票 ${symbol}`,
  tradeDate: '2026-07-22',
  presetId: 'strong-trend',
  matched,
  rank,
  score: 70,
  confidence: 80,
  technicalScore: 75,
  decisionScore: 72,
  healthScore: 70,
  snapshotScore: 69,
  close: 100,
  changePercent: 1,
  rsi14: 55,
  macdHistogram: 1,
  volumeRatio: 1.2,
  aboveMa20: true,
  aboveMa60: true,
  k: 60,
  d: 55,
  return20: 5,
  return60: 10,
  volatility20: 18,
  historyRecordCount: 250,
  stale: false,
  dateAlignmentStatus: 'aligned',
  institutionalNet: 1_000,
  riskLevel: 'low',
  reasons: ['符合既有技術條件'],
  risks: [],
  matchedRules: ['above-ma20'],
  missingFields: [],
  sourceSummary: ['TWSE Official'],
  warnings: [],
})

describe('TodayOpportunitiesSection', () => {
  it('deduplicates, follows existing rank, and limits technical candidates', () => {
    const dataset = {
      schemaVersion: '1.0' as const,
      formulaVersion: 'screener-v1.0' as const,
      tradeDate: '2026-07-22',
      generatedAt: '2026-07-22T08:00:00Z',
      technicalIndexGeneratedAt: '2026-07-22T08:00:00Z',
      sampleCount: 4,
      complete250Count: 4,
      highRiskCount: 0,
      presets: [],
      results: [result('2317', 2), result('2330', 1), result('2330', 3), result('2303', 4, false)],
      warnings: [],
    }
    expect(selectTechnicalOpportunities(dataset, 5).map((item) => item.symbol)).toEqual(['2330', '2317'])
  })

  it('uses only repository-fed props and routes rows to stock detail', () => {
    const source = readFileSync(new URL('../TodayOpportunitiesSection.tsx', import.meta.url), 'utf8')
    const hook = readFileSync(new URL('../../../hooks/useTodayDashboardData.ts', import.meta.url), 'utf8')
    expect(source).toContain('to={`/stock/${symbol}`}')
    expect(source).not.toContain('fetch(')
    expect(hook).toContain("repositoryHub.institutions.getTopNetBuy('total', 5)")
    expect(hook).toContain('repositoryHub.hotStocks.getTop(5)')
    expect(hook).toContain('repositoryHub.screener.getDataset()')
  })
})
