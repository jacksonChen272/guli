import { MemoryCache } from '../cache/MemoryCache'
import { calculateStockHealth } from '../services/stockHealthService'
import type { DecisionComparison, DecisionDirection, DecisionResult } from '../types/decision'
import type { IndustrySnapshot } from '../types/industrySnapshot'
import type { Stock, WatchlistItem } from '../types/stock'
import type { StockSnapshotDailyIndex, StockSnapshotDiff, StockSnapshotItem } from '../types/stockSnapshot'
import type {
  ObservationStatus,
  WatchlistAlert,
  WatchlistDashboardCacheDiagnostics,
  WatchlistDashboardData,
  WatchlistDashboardRow,
  WatchlistDataSource,
  WatchlistScoreGrade,
  WatchlistTodayAction,
} from '../types/watchlistDashboard'

export interface WatchlistDashboardSource {
  getWatchlist: () => WatchlistItem[]
  getStocks: () => Stock[]
  getMarketDecision: () => Promise<DecisionResult>
  getStockDecision: (symbol: string, date?: string) => Promise<DecisionResult>
  getStockComparison: (symbol: string, currentDate: string) => Promise<DecisionComparison>
  getSnapshotIndex: () => Promise<StockSnapshotDailyIndex>
  getStockSnapshot: (symbol: string, date?: string) => Promise<StockSnapshotItem>
  getStockDiff: (symbol: string, currentDate?: string) => Promise<StockSnapshotDiff>
  getIndustrySnapshot: () => Promise<IndustrySnapshot>
  getIndustryDecision: (industryId: string) => Promise<DecisionResult>
}

export interface ObservationStatusInput {
  decisionScore: number | null
  decisionChange: number | null
  confidence: number
  healthScore: number | null
  snapshotScore: number | null
  riskScore: number
  highRiskCount: number
  price: number | null
  stopLossPrice?: number
}

export interface WatchlistScoreInput {
  decisionScore: number | null
  healthScore: number | null
  snapshotScore: number | null
  confidence: number | null
}

const average = (values: Array<number | null>) => {
  const available = values.filter((value): value is number => value !== null && Number.isFinite(value))
  return available.length ? Number((available.reduce((sum, value) => sum + value, 0) / available.length).toFixed(1)) : null
}
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

export function calculateWatchlistScore(input: WatchlistScoreInput): number | null {
  const { decisionScore, healthScore, snapshotScore, confidence } = input
  if ([decisionScore, healthScore, snapshotScore, confidence].some((value) => value === null || !Number.isFinite(value))) return null
  return Number((decisionScore! * 0.4 + healthScore! * 0.25 + snapshotScore! * 0.2 + confidence! * 0.15).toFixed(1))
}

export function gradeWatchlistScore(score: number | null): WatchlistScoreGrade {
  if (score !== null && score >= 85) return 'A+'
  if (score !== null && score >= 75) return 'A'
  if (score !== null && score >= 60) return 'B'
  if (score !== null && score >= 45) return 'C'
  return 'D'
}

export function determineObservationStatus(input: ObservationStatusInput): ObservationStatus {
  if (input.decisionScore === null || input.healthScore === null || input.snapshotScore === null || input.confidence < 25) return 'UNKNOWN'
  const nearStopLoss = input.price !== null && input.stopLossPrice !== undefined && input.price <= input.stopLossPrice * 1.03
  if (nearStopLoss || (input.decisionChange !== null && input.decisionChange <= -10) || input.decisionScore <= 30) return 'SELL WATCH'
  if (input.riskScore >= 65 || input.highRiskCount >= 2 || input.decisionScore < 40) return 'RISK'
  if (input.decisionScore >= 80 && input.confidence >= 70 && input.snapshotScore >= 70 && input.healthScore >= 70) return 'STRONG'
  if (input.decisionScore >= 65 && input.confidence >= 55 && input.riskScore < 50) return 'ACCUMULATE'
  return 'WATCH'
}

export function calculateWatchlistRiskScore(
  decision: DecisionResult,
  snapshot: StockSnapshotItem,
  marketDirection: DecisionDirection,
  industryDirection: DecisionDirection,
): number {
  const decisionRisk = decision.risks.reduce((sum, risk) => sum + (risk.severity === 'high' ? 24 : risk.severity === 'medium' ? 13 : 6), 0)
  const snapshotRisk = snapshot.risks.reduce((sum, risk) => sum + (risk.severity === 'high' ? 18 : risk.severity === 'medium' ? 10 : 4), 0)
  const negativeFactors = decision.factors.filter((factor) => (factor.contribution ?? 0) < 0).reduce((sum, factor) => sum + Math.min(10, Math.abs(factor.contribution ?? 0)), 0)
  const directionPenalty = (marketDirection === 'bearish' ? 8 : 0) + (industryDirection === 'bearish' ? 10 : 0)
  const scorePenalty = decision.score === null ? 15 : Math.max(0, (50 - decision.score) * 0.5)
  return clamp(decisionRisk + snapshotRisk + negativeFactors + directionPenalty + scorePenalty)
}

function hasInstitutionalBuyingStreak(stock: Stock) {
  const recent = stock.institutionalHistory.slice(-3)
  return recent.length === 3 && recent.every((day) => day.total > 0)
}

export function generateQuickTags(stock: Stock, snapshot: StockSnapshotItem, marketDirection: DecisionDirection, industryDirection: DecisionDirection) {
  const tags: string[] = []
  const averageVolume = stock.priceHistory.slice(-20).reduce((sum, point) => sum + (point.volume ?? 0), 0) / Math.max(1, stock.priceHistory.slice(-20).length)
  if (hasInstitutionalBuyingStreak(stock)) tags.push('法人連買')
  if ((snapshot.priceStrengthScore ?? 0) >= 75 || (snapshot.quote.changePercent ?? 0) >= 3) tags.push('突破')
  if (averageVolume > 0 && (snapshot.quote.tradeVolume ?? stock.volume) >= averageVolume * 1.5) tags.push('高成交量')
  if ((snapshot.liquidityScore ?? 100) < 40) tags.push('低流動')
  for (const keyword of ['AI', 'PCB', '散熱', '半導體']) if (stock.industry.toUpperCase().includes(keyword.toUpperCase())) tags.push(keyword)
  if (marketDirection === 'bullish') tags.push('市場偏強')
  if (marketDirection === 'bearish') tags.push('市場偏弱')
  if (industryDirection === 'bullish') tags.push('產業偏強')
  if (industryDirection === 'bearish') tags.push('產業偏弱')
  return [...new Set(tags)]
}

function resolveSource(decision: DecisionResult, snapshot: StockSnapshotItem): { source: WatchlistDataSource; label: string } {
  const sourceTypes = [...decision.sources.map((source) => source.type), ...snapshot.sources.map((source) => source.type)]
  if (sourceTypes.includes('fallback')) return { source: 'fallback', label: '回退資料' }
  if (snapshot.sources.some((source) => source.type === 'official')) return { source: 'official', label: 'TWSE 官方／衍生' }
  if (sourceTypes.includes('mock')) return { source: 'mock', label: '模擬資料' }
  return { source: 'missing', label: '資料不足' }
}

function buildTimeline(decision: DecisionResult, snapshot: StockSnapshotItem, comparison: DecisionComparison, diff: StockSnapshotDiff) {
  const riskChange = comparison.available ? comparison.addedRisks.length - comparison.removedRisks.length : diff.available ? diff.addedRisks.length - diff.removedRisks.length : null
  const currentRiskCount = decision.risks.length + snapshot.risks.length
  const current = {
    tradeDate: decision.tradeDate,
    decisionScore: decision.score,
    confidence: decision.confidence,
    snapshotScore: snapshot.snapshotScore,
    riskCount: currentRiskCount,
    decisionChange: comparison.scoreChange,
    confidenceChange: comparison.confidenceChange,
    snapshotChange: diff.changes.snapshotScore,
    riskChange,
    isCurrent: true,
  }
  if (!comparison.previousDate && !diff.previousDate) return [current]
  return [current, {
    tradeDate: comparison.previousDate ?? diff.previousDate ?? '—',
    decisionScore: decision.score !== null && comparison.scoreChange !== null ? Number((decision.score - comparison.scoreChange).toFixed(1)) : null,
    confidence: comparison.confidenceChange !== null ? decision.confidence - comparison.confidenceChange : null,
    snapshotScore: snapshot.snapshotScore !== null && diff.changes.snapshotScore !== null ? Number((snapshot.snapshotScore - diff.changes.snapshotScore).toFixed(1)) : null,
    riskCount: riskChange !== null ? Math.max(0, currentRiskCount - riskChange) : currentRiskCount,
    decisionChange: null,
    confidenceChange: null,
    snapshotChange: null,
    riskChange: null,
    isCurrent: false,
  }]
}

export function buildWatchlistAlerts(rows: WatchlistDashboardRow[], stocks: Stock[]): WatchlistAlert[] {
  const alerts: WatchlistAlert[] = []
  const add = (row: WatchlistDashboardRow, code: string, title: string, detail: string, severity: WatchlistAlert['severity'], priority: number) => alerts.push({ id: `${row.symbol}-${code}`, symbol: row.symbol, name: row.name, title, detail, severity, priority })
  for (const row of rows) {
    const stock = stocks.find((item) => item.symbol === row.symbol)
    if (row.decisionChange !== null && row.decisionChange <= -10) add(row, 'decision-drop', 'Decision 下降超過 10 分', `較前期下降 ${Math.abs(row.decisionChange).toFixed(1)} 分`, 'critical', 100 + Math.abs(row.decisionChange))
    if (stock && hasInstitutionalBuyingStreak(stock)) add(row, 'institution-buy', '法人連買 3 天', '最近三筆法人資料皆為買超', 'positive', 55)
    if (row.riskChange !== null && row.riskChange > 0) add(row, 'risk-rise', '高風險增加', `較前期增加 ${row.riskChange} 項風險`, 'warning', 80 + row.riskChange)
    if (row.price !== null && row.stopLossPrice !== undefined && row.price <= row.stopLossPrice * 1.03) add(row, 'near-stop', '接近停損參考價', `現價 ${row.price}，停損參考 ${row.stopLossPrice}`, 'critical', 110)
    if (row.riskLevel === 'high') add(row, 'high-risk', '風險分數偏高', `風險分數 ${row.riskScore}`, 'warning', 70 + row.riskScore / 10)
  }
  return alerts.sort((a, b) => b.priority - a.priority || a.symbol.localeCompare(b.symbol))
}

export function buildTodayActions(rows: WatchlistDashboardRow[]): WatchlistTodayAction[] {
  const actions: WatchlistTodayAction[] = []
  for (const row of rows) {
    const observe: string[] = []
    if ((row.decisionChange ?? 0) >= 3) observe.push(`Decision 提升 ${row.decisionChange!.toFixed(1)} 分`)
    if ((row.confidenceChange ?? 0) >= 3) observe.push(`Confidence 提升 ${row.confidenceChange!.toFixed(0)} 分`)
    if (row.tags.includes('法人連買')) observe.push('法人連續買超')
    if (row.tags.includes('突破')) observe.push('價格強度出現突破訊號')
    if (row.observationStatus === 'STRONG' || row.observationStatus === 'ACCUMULATE') observe.push(`觀察狀態為 ${row.observationStatus}`)
    if (observe.length) actions.push({ id: `${row.symbol}-observe`, kind: 'observe', symbol: row.symbol, name: row.name, title: '今天值得注意', reasons: [...new Set(observe)].slice(0, 3), strength: (row.watchlistScore ?? 0) + Math.max(0, row.decisionChange ?? 0) })
    const caution: string[] = []
    if (row.riskChange !== null && row.riskChange > 0) caution.push(`風險增加 ${row.riskChange} 項`)
    if (row.marketDirection === 'bearish') caution.push('市場方向偏弱')
    if (row.industryDirection === 'bearish') caution.push('產業方向偏弱')
    if (row.tags.includes('低流動')) caution.push('流動性下降')
    if (row.observationStatus === 'SELL WATCH') caution.push('接近停損或 Decision 明顯轉弱')
    if (row.riskLevel === 'high') caution.push(`風險分數 ${row.riskScore}`)
    if (caution.length) actions.push({ id: `${row.symbol}-caution`, kind: 'caution', symbol: row.symbol, name: row.name, title: '今天需留意', reasons: [...new Set(caution)].slice(0, 3), strength: row.riskScore + Math.max(0, -(row.decisionChange ?? 0)) })
  }
  return actions.sort((a, b) => b.strength - a.strength || a.symbol.localeCompare(b.symbol)).slice(0, 8)
}

function fingerprint(value: unknown) {
  const text = JSON.stringify(value)
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return (hash >>> 0).toString(36)
}

function emptyDashboard(warning: string): WatchlistDashboardData {
  return { generatedAt: new Date().toISOString(), tradeDate: '—', cacheKey: 'empty', summary: { stockCount: 0, averageDecision: null, averageHealth: null, averageSnapshot: null, averageConfidence: null, highRiskCount: 0, officialCoverageRate: 0, watchlistScore: null, watchlistGrade: 'D' }, alerts: [], bestCandidates: [], riskRanking: [], actions: [], rows: [], warnings: [warning] }
}

export class WatchlistDashboardRepository {
  private readonly cache = new MemoryCache()
  private activeKey: string | null = null
  private calculations = 0
  private diagnostics: WatchlistDashboardCacheDiagnostics = { state: 'miss', cacheKey: null, calculations: 0 }

  constructor(private readonly source: WatchlistDashboardSource) {}

  async getDashboard(): Promise<WatchlistDashboardData> {
    const items = this.source.getWatchlist()
    if (!items.length) return emptyDashboard('自選股清單目前沒有股票。')
    try {
      const [market, index, industrySnapshot] = await Promise.all([this.source.getMarketDecision(), this.source.getSnapshotIndex(), this.source.getIndustrySnapshot()])
      const universe = this.source.getStocks()
      const industryDecisionEntries = await Promise.all(industrySnapshot.industries.map(async (industry) => [industry.industryName, await this.source.getIndustryDecision(industry.industryId).catch(() => null)] as const))
      const industryDecisions = new Map(industryDecisionEntries)
      const loaded = await Promise.all(items.map(async (item) => {
        try {
          const [decision, snapshot] = await Promise.all([this.source.getStockDecision(item.symbol), this.source.getStockSnapshot(item.symbol)])
          const [comparison, diff] = await Promise.all([
            this.source.getStockComparison(item.symbol, decision.tradeDate).catch((): DecisionComparison => ({ entityType: 'stock', entityId: item.symbol, currentDate: decision.tradeDate, previousDate: null, available: false, scoreChange: null, confidenceChange: null, labelChanged: false, addedRisks: [], removedRisks: [], warnings: ['沒有前期 Decision 可比較。'] })),
            this.source.getStockDiff(item.symbol, snapshot.tradeDate).catch((): StockSnapshotDiff => ({ symbol: item.symbol, currentDate: snapshot.tradeDate, previousDate: null, available: false, changes: { close: null, changePercent: null, tradeValue: null, peRatio: null, dailyRangePercent: null, snapshotScore: null, riskCount: null }, addedRisks: [], removedRisks: [], warnings: ['沒有前期 Snapshot 可比較。'] })),
          ])
          return { item, decision, snapshot, comparison, diff }
        } catch (error) {
          return { item, error: error instanceof Error ? error.message : '資料讀取失敗' }
        }
      }))
      const successful = loaded.filter((entry): entry is Extract<typeof loaded[number], { decision: DecisionResult }> => 'decision' in entry)
      const signature = fingerprint({ watchlist: items, snapshot: [index.tradeDate, index.generatedAt], market: [market.tradeDate, market.score, market.confidence, market.direction], industries: industryDecisionEntries.map(([name, decision]) => [name, decision?.tradeDate, decision?.score, decision?.confidence, decision?.direction]), decisions: successful.map(({ decision, snapshot }) => [decision.entityId, decision.tradeDate, decision.score, decision.confidence, decision.risks.map((risk) => risk.code), snapshot.snapshotScore, snapshot.risks.map((risk) => risk.code)]) })
      const key = `watchlist-dashboard:${signature}`
      const cached = this.cache.get<WatchlistDashboardData>(key)
      if (cached.state === 'hit' && cached.entry) {
        this.diagnostics = { state: 'hit', cacheKey: key, calculations: this.calculations }
        return cached.entry.value
      }
      const rows = successful.map(({ item, decision, snapshot, comparison, diff }): WatchlistDashboardRow => {
        const stock = universe.find((entry) => entry.symbol === item.symbol)
        const healthScore = stock ? calculateStockHealth(stock, universe).totalScore : null
        const industryDirection = stock ? industryDecisions.get(stock.industry)?.direction ?? 'unknown' : 'unknown'
        const riskScore = calculateWatchlistRiskScore(decision, snapshot, market.direction, industryDirection)
        const highRiskCount = decision.risks.filter((risk) => risk.severity === 'high').length + snapshot.risks.filter((risk) => risk.severity === 'high').length
        const watchlistScore = calculateWatchlistScore({ decisionScore: decision.score, healthScore, snapshotScore: snapshot.snapshotScore, confidence: decision.confidence })
        const riskChange = comparison.available ? comparison.addedRisks.length - comparison.removedRisks.length : diff.available ? diff.addedRisks.length - diff.removedRisks.length : null
        const source = resolveSource(decision, snapshot)
        const price = snapshot.quote.close ?? stock?.price ?? null
        const rowBase = { decisionScore: decision.score, decisionChange: comparison.scoreChange, confidence: decision.confidence, healthScore, snapshotScore: snapshot.snapshotScore, riskScore, highRiskCount, price, stopLossPrice: item.stopLossPrice }
        return {
          symbol: item.symbol, name: decision.entityName || stock?.name || item.symbol, industry: stock?.industry ?? '資料不足', price, changePercent: snapshot.quote.changePercent ?? stock?.changePercent ?? null, volume: snapshot.quote.tradeVolume ?? stock?.volume ?? null,
          decisionScore: decision.score, decisionChange: comparison.scoreChange, confidence: decision.confidence, confidenceChange: comparison.confidenceChange, healthScore, snapshotScore: snapshot.snapshotScore, snapshotChange: diff.changes.snapshotScore,
          watchlistScore, watchlistGrade: gradeWatchlistScore(watchlistScore), riskScore, riskLevel: riskScore >= 65 ? 'high' : riskScore >= 35 ? 'medium' : 'low', riskChange, highRiskCount,
          observationStatus: determineObservationStatus(rowBase), marketDirection: market.direction, industryDirection, source: source.source, sourceLabel: source.label, updatedAt: index.generatedAt,
          tags: stock ? generateQuickTags(stock, snapshot, market.direction, industryDirection) : [], topPositiveFactors: [...decision.factors].filter((factor) => (factor.contribution ?? 0) > 0).sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0)).slice(0, 3),
          topNegativeFactors: [...decision.factors].filter((factor) => (factor.contribution ?? 0) < 0).sort((a, b) => (a.contribution ?? 0) - (b.contribution ?? 0)).slice(0, 3), risks: decision.risks, timeline: buildTimeline(decision, snapshot, comparison, diff), decision, snapshot, stopLossPrice: item.stopLossPrice,
        }
      })
      const componentAverages = { decisionScore: average(rows.map((row) => row.decisionScore)), healthScore: average(rows.map((row) => row.healthScore)), snapshotScore: average(rows.map((row) => row.snapshotScore)), confidence: average(rows.map((row) => row.confidence)) }
      const watchlistScore = calculateWatchlistScore(componentAverages)
      const warnings = loaded.filter((entry): entry is Extract<typeof loaded[number], { error: string }> => 'error' in entry).map((entry) => `${entry.item.symbol}：${entry.error}`)
      const data: WatchlistDashboardData = {
        generatedAt: new Date().toISOString(), tradeDate: index.tradeDate, cacheKey: key,
        summary: { stockCount: rows.length, averageDecision: componentAverages.decisionScore, averageHealth: componentAverages.healthScore, averageSnapshot: componentAverages.snapshotScore, averageConfidence: componentAverages.confidence, highRiskCount: rows.filter((row) => row.riskLevel === 'high').length, officialCoverageRate: rows.length ? Math.round(rows.filter((row) => row.source === 'official').length / rows.length * 100) : 0, watchlistScore, watchlistGrade: gradeWatchlistScore(watchlistScore) },
        alerts: buildWatchlistAlerts(rows, universe), bestCandidates: [...rows].sort((a, b) => (b.watchlistScore ?? -1) - (a.watchlistScore ?? -1) || (b.decisionScore ?? -1) - (a.decisionScore ?? -1)).slice(0, 5), riskRanking: [...rows].sort((a, b) => b.riskScore - a.riskScore || (a.decisionScore ?? 101) - (b.decisionScore ?? 101)).slice(0, 5), actions: buildTodayActions(rows), rows, warnings,
      }
      if (this.activeKey) this.cache.delete(this.activeKey)
      this.activeKey = key
      this.calculations += 1
      this.cache.set(key, data, Number.MAX_SAFE_INTEGER - Date.now(), 'WatchlistDashboardRepository')
      this.diagnostics = { state: 'miss', cacheKey: key, calculations: this.calculations }
      return data
    } catch (error) {
      return emptyDashboard(error instanceof Error ? error.message : '智慧自選股資料讀取失敗。')
    }
  }

  invalidate() {
    if (this.activeKey) this.cache.delete(this.activeKey)
    this.activeKey = null
    this.diagnostics = { state: 'miss', cacheKey: null, calculations: this.calculations }
  }

  getCacheDiagnostics() { return { ...this.diagnostics } }
}
