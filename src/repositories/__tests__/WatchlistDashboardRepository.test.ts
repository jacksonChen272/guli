import { describe, expect, it } from 'vitest'
import {
  WatchlistDashboardRepository,
  buildTodayActions,
  buildWatchlistAlerts,
  calculateWatchlistRiskScore,
  calculateWatchlistScore,
  determineObservationStatus,
  generateQuickTags,
  gradeWatchlistScore,
  type WatchlistDashboardSource,
} from '../WatchlistDashboardRepository'
import { filterAndSortWatchlistRows } from '../../components/watchlist/WatchlistDashboardTable'
import type { DecisionComparison, DecisionResult } from '../../types/decision'
import type { IndustrySnapshot } from '../../types/industrySnapshot'
import type { Stock, WatchlistItem } from '../../types/stock'
import type { StockSnapshotDailyIndex, StockSnapshotDiff, StockSnapshotItem } from '../../types/stockSnapshot'
import type { WatchlistDashboardFilters } from '../../types/watchlistDashboard'

const makeStock = (symbol = '2330'): Stock => ({
  symbol, name: symbol === '2330' ? '台積電' : '測試股票', industry: 'AI 半導體', board: 'listed', price: 100, change: 2, changePercent: 2, volume: 2_000,
  institutions: { foreign: 100, trust: 20, dealer: 10, total: 130 },
  institutionalHistory: Array.from({ length: 20 }, (_, index) => ({ date: `2026-06-${String(index + 1).padStart(2, '0')}`, foreign: 10, trust: 2, dealer: 1, total: 13 })),
  capitalFlow: 20, momentum: 8, cumulative20d: 200, rsi: 62, volatility: 1.2, marginChange: 0.5, industryStrength: 72,
  priceHistory: Array.from({ length: 20 }, (_, index) => ({ date: `2026-06-${String(index + 1).padStart(2, '0')}`, value: 80 + index, volume: 1_000 })),
})

const makeDecision = (score = 82, confidence = 76): DecisionResult => ({
  entityType: 'stock', entityId: '2330', entityName: '台積電', tradeDate: '2026-07-13', score, label: score >= 80 ? '極強' : score >= 60 ? '偏強' : '偏弱', direction: score >= 60 ? 'bullish' : 'bearish', confidence,
  summary: '固定規則摘要',
  factors: [
    { code: 'trend', name: '趨勢', rawValue: 80, normalizedScore: 80, weight: .5, contribution: 12, direction: 'positive', explanation: '趨勢偏強', evidence: [], sourceType: 'derived' },
    { code: 'risk', name: '波動風險', rawValue: 30, normalizedScore: 30, weight: .5, contribution: -8, direction: 'negative', explanation: '波動需留意', evidence: [], sourceType: 'derived' },
  ], risks: [], trace: { formulaVersion: 'decision-v1.0', totalPositiveContribution: 12, totalNegativeContribution: -8, totalContribution: 4, availableWeight: 1, missingWeight: 0, normalizationApplied: false, calculationSteps: ['固定公式'] },
  sources: [{ id: 'twse', name: 'TWSE', type: 'official', tradeDate: '2026-07-13', fields: ['close'] }], warnings: [],
})

const makeSnapshot = (score = 78, risks: StockSnapshotItem['risks'] = []): StockSnapshotItem => ({
  symbol: '2330', name: '台積電', tradeDate: '2026-07-13', market: 'TWSE', instrumentType: 'stock',
  quote: { open: 98, high: 102, low: 97, close: 100, change: 2, changePercent: 2, tradeVolume: 2_000, transactionCount: 100, tradeValue: 200_000, peRatio: 20 },
  dailyRangePercent: 5, turnoverAverageValue: 180_000, pricePosition: 70, liquidityScore: 80, priceStrengthScore: 82, valuationRiskScore: 20, snapshotScore: score, status: '偏強', risks, tags: [], sources: [{ type: 'official', name: 'TWSE' }], warnings: [],
})

const noComparison = (): DecisionComparison => ({ entityType: 'stock', entityId: '2330', currentDate: '2026-07-13', previousDate: null, available: false, scoreChange: null, confidenceChange: null, labelChanged: false, addedRisks: [], removedRisks: [], warnings: [] })
const noDiff = (): StockSnapshotDiff => ({ symbol: '2330', currentDate: '2026-07-13', previousDate: null, available: false, changes: { close: null, changePercent: null, tradeValue: null, peRatio: null, dailyRangePercent: null, snapshotScore: null, riskCount: null }, addedRisks: [], removedRisks: [], warnings: [] })
const industrySnapshot: IndustrySnapshot = { schemaVersion: '1.0', tradeDate: '2026-07-13', generatedAt: '2026-07-13T08:00:00.000Z', market: 'TWSE', industries: [{ industryId: 'ai', industryName: 'AI 半導體', rank: 1, previousRank: 2, rankChange: 1, strengthScore: 80, momentumScore: 75, capitalFlowScore: 70, breadthScore: 70, relativeStrengthScore: 75, riskScore: 20, status: '強勢', direction: 'up', return1d: 2, return5d: 5, return20d: 10, institutionalNetBuy: 100, tradingAmount: 1000, advanceCount: 10, declineCount: 2, unchangedCount: 1, leaderStocks: [], laggardStocks: [], risks: [], tags: ['AI'], sources: [] }], sources: [], warnings: [] }
const index = (generatedAt = '2026-07-13T08:00:00.000Z'): StockSnapshotDailyIndex => ({ schemaVersion: '1.0', market: 'TWSE', tradeDate: '2026-07-13', generatedAt, recordCount: 1, records: [], sources: [{ type: 'official', name: 'TWSE' }], warnings: [] })

function createSource() {
  const state = { items: [{ symbol: '2330', groupId: 'priority', note: '', stopLossPrice: 95, createdAt: '2026-07-01T00:00:00.000Z' }] as WatchlistItem[], decisionScore: 82, confidence: 76, snapshotScore: 78, generatedAt: '2026-07-13T08:00:00.000Z', comparison: noComparison() }
  const source: WatchlistDashboardSource = {
    getWatchlist: () => state.items,
    getStocks: () => state.items.map((item) => makeStock(item.symbol)),
    getMarketDecision: async () => ({ ...makeDecision(70, 70), entityType: 'market', entityId: 'TWSE', entityName: '市場' }),
    getStockDecision: async (symbol) => ({ ...makeDecision(state.decisionScore, state.confidence), entityId: symbol, entityName: symbol === '2330' ? '台積電' : '測試股票' }),
    getStockComparison: async () => state.comparison,
    getSnapshotIndex: async () => index(state.generatedAt),
    getStockSnapshot: async (symbol) => ({ ...makeSnapshot(state.snapshotScore), symbol, name: symbol === '2330' ? '台積電' : '測試股票' }),
    getStockDiff: async () => noDiff(),
    getIndustrySnapshot: async () => industrySnapshot,
    getIndustryDecision: async () => ({ ...makeDecision(75, 70), entityType: 'industry', entityId: 'ai', entityName: 'AI 半導體' }),
  }
  return { state, source }
}

describe('Watchlist Score', () => {
  it('依 40/25/20/15 權重計算', () => expect(calculateWatchlistScore({ decisionScore: 80, healthScore: 60, snapshotScore: 70, confidence: 90 })).toBe(74.5))
  it('缺少任一必要分數時不偽造總分', () => expect(calculateWatchlistScore({ decisionScore: null, healthScore: 60, snapshotScore: 70, confidence: 90 })).toBeNull())
  it('85 分為 A+', () => expect(gradeWatchlistScore(85)).toBe('A+'))
  it('75 分為 A', () => expect(gradeWatchlistScore(75)).toBe('A'))
  it('60 分為 B', () => expect(gradeWatchlistScore(60)).toBe('B'))
  it('45 分為 C', () => expect(gradeWatchlistScore(45)).toBe('C'))
  it('低於 45 分為 D', () => expect(gradeWatchlistScore(44.9)).toBe('D'))
})

describe('Observation Status', () => {
  const base = { decisionScore: 60, decisionChange: 0, confidence: 60, healthScore: 60, snapshotScore: 60, riskScore: 20, highRiskCount: 0, price: 100 }
  it('缺少 Decision 為 UNKNOWN', () => expect(determineObservationStatus({ ...base, decisionScore: null })).toBe('UNKNOWN'))
  it('Confidence 過低為 UNKNOWN', () => expect(determineObservationStatus({ ...base, confidence: 20 })).toBe('UNKNOWN'))
  it('Decision 下降 10 分為 SELL WATCH', () => expect(determineObservationStatus({ ...base, decisionChange: -10 })).toBe('SELL WATCH'))
  it('接近停損價為 SELL WATCH', () => expect(determineObservationStatus({ ...base, price: 97, stopLossPrice: 95 })).toBe('SELL WATCH'))
  it('高風險分數為 RISK', () => expect(determineObservationStatus({ ...base, riskScore: 70 })).toBe('RISK'))
  it('兩項高風險為 RISK', () => expect(determineObservationStatus({ ...base, highRiskCount: 2 })).toBe('RISK'))
  it('四項品質同步達標為 STRONG', () => expect(determineObservationStatus({ ...base, decisionScore: 85, confidence: 75, healthScore: 75, snapshotScore: 75 })).toBe('STRONG'))
  it('偏正向且風險可控為 ACCUMULATE', () => expect(determineObservationStatus({ ...base, decisionScore: 70, confidence: 65 })).toBe('ACCUMULATE'))
  it('其他情況維持 WATCH', () => expect(determineObservationStatus(base)).toBe('WATCH'))
})

describe('標籤、風險、提醒與 Today Action', () => {
  it('法人連買三筆會產生法人連買標籤', () => expect(generateQuickTags(makeStock(), makeSnapshot(), 'neutral', 'neutral')).toContain('法人連買'))
  it('高價格強度會產生突破標籤', () => expect(generateQuickTags(makeStock(), makeSnapshot(), 'neutral', 'neutral')).toContain('突破'))
  it('產業與市場方向會產生快速標籤', () => expect(generateQuickTags(makeStock(), makeSnapshot(), 'bullish', 'bearish')).toEqual(expect.arrayContaining(['AI', '半導體', '市場偏強', '產業偏弱'])))
  it('高嚴重度風險會提高風險分數', () => { const clean = calculateWatchlistRiskScore(makeDecision(), makeSnapshot(), 'neutral', 'neutral'); const risky = calculateWatchlistRiskScore({ ...makeDecision(), risks: [{ code: 'x', severity: 'high', title: '高風險', explanation: '測試', sourceType: 'derived' }] }, makeSnapshot(78, [{ code: 'wide_daily_range', severity: 'high', title: '大幅波動', reason: '測試', source: 'derived' }]), 'bearish', 'bearish'); expect(risky).toBeGreaterThan(clean) })
  it('Decision 大跌提醒排序優先', async () => { const { state, source } = createSource(); state.comparison = { ...noComparison(), available: true, previousDate: '2026-07-12', scoreChange: -12 }; const data = await new WatchlistDashboardRepository(source).getDashboard(); expect(data.alerts[0].title).toContain('Decision 下降') })
  it('接近停損會產生提醒', async () => { const { state, source } = createSource(); state.items[0].stopLossPrice = 98; const data = await new WatchlistDashboardRepository(source).getDashboard(); expect(buildWatchlistAlerts(data.rows, source.getStocks()).some((alert) => alert.title.includes('停損'))).toBe(true) })
  it('Decision 與 Confidence 提升會產生值得觀察行動', async () => { const { state, source } = createSource(); state.comparison = { ...noComparison(), available: true, previousDate: '2026-07-12', scoreChange: 6, confidenceChange: 5 }; const data = await new WatchlistDashboardRepository(source).getDashboard(); expect(buildTodayActions(data.rows).some((action) => action.kind === 'observe')).toBe(true) })
  it('高風險會產生需留意行動', async () => { const { source } = createSource(); const data = await new WatchlistDashboardRepository(source).getDashboard(); const row = { ...data.rows[0], riskLevel: 'high' as const, riskScore: 80 }; expect(buildTodayActions([row]).some((action) => action.kind === 'caution')).toBe(true) })
})

describe('搜尋、篩選與排序', () => {
  const baseFilters: WatchlistDashboardFilters = { query: '', minimumDecision: 0, confidence: 'all', source: 'all', risk: 'all', industry: 'all', sort: 'decision' }
  it('可用標籤搜尋', async () => { const data = await new WatchlistDashboardRepository(createSource().source).getDashboard(); expect(filterAndSortWatchlistRows([...data.rows], { ...baseFilters, query: '法人連買' })).toHaveLength(1) })
  it('可用 Observation Status 搜尋', async () => { const data = await new WatchlistDashboardRepository(createSource().source).getDashboard(); expect(filterAndSortWatchlistRows([...data.rows], { ...baseFilters, query: data.rows[0].observationStatus })).toHaveLength(1) })
  it('Decision 門檻會排除低分股票', async () => { const { state, source } = createSource(); state.decisionScore = 59; const data = await new WatchlistDashboardRepository(source).getDashboard(); expect(filterAndSortWatchlistRows([...data.rows], { ...baseFilters, minimumDecision: 60 })).toHaveLength(0) })
  it('官方來源篩選可用', async () => { const data = await new WatchlistDashboardRepository(createSource().source).getDashboard(); expect(filterAndSortWatchlistRows([...data.rows], { ...baseFilters, source: 'official' })).toHaveLength(1) })
  it('風險排序由高至低', async () => { const data = await new WatchlistDashboardRepository(createSource().source).getDashboard(); const second = { ...data.rows[0], symbol: '2603', riskScore: data.rows[0].riskScore + 20 }; const rows = filterAndSortWatchlistRows([data.rows[0], second], { ...baseFilters, sort: 'risk' }); expect(rows[0].symbol).toBe('2603') })
})

describe('WatchlistDashboardRepository Cache', () => {
  it('相同 Decision、Snapshot 與 Watchlist 直接命中 Cache', async () => { const repository = new WatchlistDashboardRepository(createSource().source); const first = await repository.getDashboard(); const second = await repository.getDashboard(); expect(second).toBe(first); expect(repository.getCacheDiagnostics()).toMatchObject({ state: 'hit', calculations: 1 }) })
  it('Decision 更新會重新計算', async () => { const { state, source } = createSource(); const repository = new WatchlistDashboardRepository(source); await repository.getDashboard(); state.decisionScore = 70; await repository.getDashboard(); expect(repository.getCacheDiagnostics().calculations).toBe(2) })
  it('Snapshot 更新會重新計算', async () => { const { state, source } = createSource(); const repository = new WatchlistDashboardRepository(source); await repository.getDashboard(); state.generatedAt = '2026-07-13T09:00:00.000Z'; await repository.getDashboard(); expect(repository.getCacheDiagnostics().calculations).toBe(2) })
  it('Watchlist 改變會重新計算', async () => { const { state, source } = createSource(); const repository = new WatchlistDashboardRepository(source); await repository.getDashboard(); state.items = [...state.items, { symbol: '2313', groupId: 'priority', note: '', createdAt: '2026-07-01T00:00:00.000Z' }]; const data = await repository.getDashboard(); expect(data.summary.stockCount).toBe(2); expect(repository.getCacheDiagnostics().calculations).toBe(2) })
  it('Summary 使用加權 Watchlist Score 且計算官方覆蓋率', async () => { const data = await new WatchlistDashboardRepository(createSource().source).getDashboard(); expect(data.summary.watchlistScore).toBe(calculateWatchlistScore({ decisionScore: data.summary.averageDecision, healthScore: data.summary.averageHealth, snapshotScore: data.summary.averageSnapshot, confidence: data.summary.averageConfidence })); expect(data.summary.officialCoverageRate).toBe(100) })
  it('沒有前期資料時 Timeline 不虛構第二天', async () => { const data = await new WatchlistDashboardRepository(createSource().source).getDashboard(); expect(data.rows[0].timeline).toHaveLength(1) })
})
