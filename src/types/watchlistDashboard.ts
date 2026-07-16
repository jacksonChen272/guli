import type { DecisionDirection, DecisionFactor, DecisionResult, DecisionRisk } from './decision'
import type { StockSnapshotItem } from './stockSnapshot'

export type ObservationStatus = 'WATCH' | 'ACCUMULATE' | 'STRONG' | 'RISK' | 'SELL WATCH' | 'UNKNOWN'
export type WatchlistScoreGrade = 'A+' | 'A' | 'B' | 'C' | 'D'
export type WatchlistDataSource = 'official' | 'mock' | 'fallback' | 'missing'
export type WatchlistRiskLevel = 'high' | 'medium' | 'low'
export type WatchlistAlertSeverity = 'critical' | 'warning' | 'positive' | 'info'
export type WatchlistActionKind = 'observe' | 'caution'

export interface ObservationTimelineEntry {
  tradeDate: string
  decisionScore: number | null
  confidence: number | null
  snapshotScore: number | null
  riskCount: number
  decisionChange: number | null
  confidenceChange: number | null
  snapshotChange: number | null
  riskChange: number | null
  isCurrent: boolean
}

export interface WatchlistDashboardRow {
  symbol: string
  name: string
  industry: string
  price: number | null
  changePercent: number | null
  volume: number | null
  decisionScore: number | null
  decisionChange: number | null
  confidence: number
  confidenceChange: number | null
  healthScore: number | null
  snapshotScore: number | null
  snapshotChange: number | null
  watchlistScore: number | null
  watchlistGrade: WatchlistScoreGrade
  riskScore: number
  riskLevel: WatchlistRiskLevel
  riskChange: number | null
  highRiskCount: number
  observationStatus: ObservationStatus
  marketDirection: DecisionDirection
  industryDirection: DecisionDirection
  source: WatchlistDataSource
  sourceLabel: string
  updatedAt: string
  tags: string[]
  topPositiveFactors: DecisionFactor[]
  topNegativeFactors: DecisionFactor[]
  risks: DecisionRisk[]
  timeline: ObservationTimelineEntry[]
  decision: DecisionResult
  snapshot: StockSnapshotItem
  stopLossPrice?: number
}

export interface WatchlistAlert {
  id: string
  symbol: string
  name: string
  title: string
  detail: string
  severity: WatchlistAlertSeverity
  priority: number
}

export interface WatchlistTodayAction {
  id: string
  kind: WatchlistActionKind
  symbol: string
  name: string
  title: string
  reasons: string[]
  strength: number
}

export interface WatchlistDashboardSummary {
  stockCount: number
  averageDecision: number | null
  averageHealth: number | null
  averageSnapshot: number | null
  averageConfidence: number | null
  highRiskCount: number
  officialCoverageRate: number
  watchlistScore: number | null
  watchlistGrade: WatchlistScoreGrade
}

export interface WatchlistDashboardData {
  generatedAt: string
  tradeDate: string
  cacheKey: string
  summary: WatchlistDashboardSummary
  alerts: WatchlistAlert[]
  bestCandidates: WatchlistDashboardRow[]
  riskRanking: WatchlistDashboardRow[]
  actions: WatchlistTodayAction[]
  rows: WatchlistDashboardRow[]
  warnings: string[]
}

export interface WatchlistDashboardCacheDiagnostics {
  state: 'hit' | 'miss'
  cacheKey: string | null
  calculations: number
}

export type WatchlistSortKey = 'decision' | 'confidence' | 'snapshot' | 'health' | 'change' | 'volume' | 'risk' | 'updatedAt' | 'status'

export interface WatchlistDashboardFilters {
  query: string
  minimumDecision: number
  confidence: 'all' | 'high' | 'medium' | 'low'
  source: 'all' | WatchlistDataSource
  risk: 'all' | 'high' | 'low'
  industry: string
  sort: WatchlistSortKey
}
