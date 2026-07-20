export type IndustrySourceType = 'official' | 'mock' | 'derived' | 'fallback'
export type IndustryStatus = '強勢' | '偏強' | '中性' | '偏弱' | '弱勢'
export type IndustryDirection = 'up' | 'flat' | 'down'

export interface IndustrySource {
  id: string
  name: string
  type: IndustrySourceType
  fields: string[]
  tradeDate?: string
  note?: string
}

export interface IndustryStockSummary {
  symbol: string
  name: string
  changePercent: number | null
  healthScore: number | null
}

export interface IndustrySnapshotItem {
  industryId: string
  industryName: string
  rank: number
  previousRank: number | null
  rankChange: number | null
  strengthScore: number
  momentumScore: number
  capitalFlowScore: number
  breadthScore: number
  relativeStrengthScore: number
  riskScore: number
  status: IndustryStatus
  direction: IndustryDirection
  return1d: number | null
  return5d: number | null
  return20d: number | null
  institutionalNetBuy: number | null
  tradingAmount: number | null
  tradingVolume?: number | null
  averageChangePercent?: number | null
  weightedChangePercent?: number | null
  advanceCount: number | null
  declineCount: number | null
  unchangedCount: number | null
  advanceRatio?: number | null
  constituentCount?: number
  officialMappedCount?: number
  derivedMappedCount?: number
  technicalAverage?: number | null
  technicalSampleCount?: number
  decisionAverage?: number | null
  decisionSampleCount?: number
  highRiskCount?: number
  dataStatus?: 'Official' | 'Mixed' | 'Partial'
  leaderStocks: IndustryStockSummary[]
  laggardStocks: IndustryStockSummary[]
  risks: string[]
  tags: string[]
  sources: IndustrySource[]
}

export interface IndustrySnapshot {
  schemaVersion: '1.0'
  tradeDate: string
  generatedAt: string
  market: 'TWSE'
  industries: IndustrySnapshotItem[]
  sources: IndustrySource[]
  warnings: string[]
}

export interface IndustrySnapshotIndexItem {
  tradeDate: string
  path: string
  topIndustries: string[]
  weakIndustries: string[]
}

export interface IndustrySnapshotIndex {
  schemaVersion: '1.0'
  updatedAt: string
  snapshots: IndustrySnapshotIndexItem[]
}

export interface IndustrySnapshotDiffItem {
  industryId: string
  industryName: string
  rankChange: number | null
  strengthChange: number | null
  momentumChange: number | null
  capitalFlowChange: number | null
}

export interface IndustrySnapshotDiff {
  currentDate: string
  previousDate: string | null
  changes: IndustrySnapshotDiffItem[]
  enteredTopFive: string[]
  exitedTopFive: string[]
}

export interface IndustryMemoryEntry { industryId: string; industryName: string; value: number }
export interface IndustryMemory {
  requestedDays: number
  snapshotCount: number
  frequentTopFive: IndustryMemoryEntry[]
  frequentWeak: IndustryMemoryEntry[]
  mostImproved: IndustryMemoryEntry | null
  mostDeclined: IndustryMemoryEntry | null
  highestAverageStrength: IndustryMemoryEntry | null
  longestStrongStreak: IndustryMemoryEntry | null
  longestWeakStreak: IndustryMemoryEntry | null
  insufficientData: boolean
}
