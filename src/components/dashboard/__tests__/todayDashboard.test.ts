import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildTodayRecommendationSignals, selectTodayRecommendations, todayRecommendationScore } from '../../../services/screener/ScreenerRankingService'
import type { ScreenerResult } from '../../../types/screener'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const result = (overrides: Partial<ScreenerResult> = {}): ScreenerResult => ({
  symbol: '2330', name: '台積電', tradeDate: '2026-07-16', presetId: 'strong-trend', matched: true, rank: 1,
  score: 82, confidence: 90, technicalScore: 80, decisionScore: 84, healthScore: 78, snapshotScore: 81,
  close: 1200, changePercent: 1.5, rsi14: 62, macdHistogram: .8, volumeRatio: 1.8, aboveMa20: true,
  aboveMa60: true, k: 70, d: 60, return20: 8, return60: 14, volatility20: 22, historyRecordCount: 260,
  stale: false, dateAlignmentStatus: 'aligned', institutionalNet: 2_000_000, riskLevel: 'low', reasons: ['收盤站上 MA20'],
  risks: [], matchedRules: ['close > MA20'], missingFields: [], sourceSummary: ['TWSE Official'], warnings: [],
  ...overrides,
})

describe('Today Dashboard recommendation rules', () => {
  it('推薦排序使用 Decision、Technical、Confidence 與風險扣分', () => expect(todayRecommendationScore(result())).toBe(83.5))
  it('高風險候選會被明確扣分', () => expect(todayRecommendationScore(result({ riskLevel: 'high' }))).toBeLessThan(todayRecommendationScore(result())))
  it('同一股票只保留分數最高的規則結果', () => expect(selectTodayRecommendations([result(), result({ presetId: 'breakout-volume', confidence: 95 })], 3)).toHaveLength(1))
  it('過期或未符合規則的股票不會進入推薦', () => expect(selectTodayRecommendations([result({ stale: true }), result({ symbol: '2317', matched: false })], 3)).toHaveLength(0))
  it('推薦理由包含 MA20、MACD、法人與 RSI', () => expect(buildTodayRecommendationSignals(result())).toEqual(['站上 MA20', 'MACD 動能改善', '法人買超', 'RSI 62']))
})

describe('Today Dashboard information flow', () => {
  const dashboard = source('../../../pages/Dashboard.tsx')
  it('首頁順序為市場、推薦、族群、技術、排行、消息、資料完整度', () => {
    const components = ['<TodayMarketHero', '<TodayRecommendations', '<IndustryRotationPreview', '<TechnicalScreenerPreview', '<MarketRanking', '<MarketNewsPlaceholder', '<DataCoverageSummary']
    components.reduce((previous, component) => { const current = dashboard.indexOf(component); expect(current).toBeGreaterThan(previous); return current }, -1)
  })
  it('首頁不再掛載舊 Data Platform 大卡', () => expect(dashboard).not.toContain('<DataSourceInfoCard'))
  it('首頁資料只經 RepositoryHub 取得', () => { const hook = source('../../../hooks/useTodayDashboardData.ts'); expect(hook).toContain('repositoryHub'); expect(hook).not.toContain('fetch(') })
  it('技術機會連到智慧選股 preset', () => expect(source('../TechnicalScreenerPreview.tsx')).toContain('/screener?preset='))
  it('新聞區不會顯示虛構新聞', () => expect(source('../MarketNewsPlaceholder.tsx')).toContain('目前不顯示虛構新聞'))
})
