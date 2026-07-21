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
  risks: [], matchedRules: ['close > MA20'], missingFields: [], sourceSummary: ['TWSE Official'], warnings: [], ...overrides,
})

describe('Today Dashboard recommendation rules', () => {
  it('推薦排序使用 Decision、Technical、Confidence 與風險扣分', () => expect(todayRecommendationScore(result())).toBe(83.5))
  it('高風險候選會被明確扣分', () => expect(todayRecommendationScore(result({ riskLevel: 'high' }))).toBeLessThan(todayRecommendationScore(result())))
  it('同一股票只保留分數最高的規則結果', () => expect(selectTodayRecommendations([result(), result({ presetId: 'breakout-volume', confidence: 95 })], 3)).toHaveLength(1))
  it('過期或未符合規則的股票不會進入推薦', () => expect(selectTodayRecommendations([result({ stale: true }), result({ symbol: '2317', matched: false })], 3)).toHaveLength(0))
  it('推薦理由包含 MA20、MACD、法人與 RSI', () => expect(buildTodayRecommendationSignals(result())).toEqual(['站上 MA20', 'MACD 動能改善', '法人買超', 'RSI 62']))
})

describe('Market Intelligence Dashboard wiring', () => {
  const dashboard = source('../../../pages/Dashboard.tsx')
  it('首頁使用單一可排序 Widget Layout', () => expect(dashboard).toContain('<DashboardWidgetLayout'))
  it('預設資訊流符合產品規格', () => { const layout = source('../DashboardWidgetLayout.tsx'); const order = source('../../../repositories/DashboardLayoutRepository.ts'); expect(layout).toContain('data-widget-id'); const ids = ["'hero'", "'sentiment'", "'summary'", "'hot-stocks'", "'recent-search'", "'watchlist'", "'recommendations'", "'heatmap'", "'industry-rotation'", "'technical-opportunities'", "'twse-rankings'", "'today-events'", "'data-coverage'"]; ids.reduce((previous, id) => { const current = order.indexOf(id); expect(current).toBeGreaterThan(previous); return current }, -1) })
  it('首頁不掛載舊 Data Platform 大卡', () => expect(dashboard).not.toContain('<DataSourceInfoCard'))
  it('首頁資料只經 RepositoryHub 取得', () => { const hook = source('../../../hooks/useTodayDashboardData.ts'); expect(hook).toContain('repositoryHub'); expect(hook).not.toContain('fetch(') })
  it('三個新 Repository 全部掛進 RepositoryHub', () => { const hub = source('../../../repositories/RepositoryHub.ts'); expect(hub).toContain('MarketSentimentRepository'); expect(hub).toContain('HotStocksRepository'); expect(hub).toContain('RecentSearchRepository') })
  it('技術機會連到智慧選股 preset', () => expect(source('../TechnicalScreenerPreview.tsx')).toContain('/screener?preset='))
  it('事件區明確標示 Coming Soon 且不虛構事件', () => { const events = source('../TodayEventsCard.tsx'); expect(events).toContain('Coming Soon'); expect(events).toContain('避免虛構市場事件') })
  it('搜尋元件不再直接操作 localStorage', () => { const search = source('../../search/GlobalStockSearch.tsx'); expect(search).toContain('repositoryHub.recentSearch'); expect(search).not.toContain('localStorage') })
  it('Widget 排序支援拖曳及 44px 觸控按鈕', () => { const layout = source('../DashboardWidgetLayout.tsx'); expect(layout).toContain('draggable'); expect(layout).toContain('onDrop'); expect(layout).toContain('h-11 w-11') })
})
