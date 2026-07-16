export type OfficialMarketStatus = 'official' | 'partial' | 'fallback'

export type OfficialMarketBreadthSource = 'twtazu_od' | 'stock_day_all'

export interface OfficialMarketTradingPoint {
  tradeDate: string
  indexValue: number
  tradingAmount: number
  tradingVolume: number
  transactionCount: number
}

export interface OfficialMarketRankingItem {
  symbol: string
  name: string
  close: number
  change: number
  changePercent: number
  tradingAmount: number
  tradingVolume: number
}

export interface OfficialMarketRankings {
  tradingAmount: OfficialMarketRankingItem[]
  tradingVolume: OfficialMarketRankingItem[]
  gainers: OfficialMarketRankingItem[]
  losers: OfficialMarketRankingItem[]
}

export interface OfficialMarketOverview {
  schemaVersion: '2.0'
  market: 'TWSE'
  tradeDate: string
  indexName: string
  indexValue: number
  change: number
  changePercent: number
  tradingAmount: number
  tradingVolume: number
  transactionCount: number
  advanceCount: number | null
  declineCount: number | null
  unchangedCount: number | null
  limitUpCount: number | null
  limitDownCount: number | null
  breadthSource: OfficialMarketBreadthSource
  tradingHistory: OfficialMarketTradingPoint[]
  rankings: OfficialMarketRankings
  source: string
  sourceUrl?: string
  fetchedAt: string
  status: OfficialMarketStatus
  warnings: string[]
}

export type MarketFieldSource = 'official' | 'mock' | 'fallback' | 'partial'

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isNonNegativeInteger = (value: unknown) => Number.isInteger(value) && Number(value) >= 0

const isRankingItem = (value: unknown): value is OfficialMarketRankingItem => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<OfficialMarketRankingItem>
  return typeof item.symbol === 'string' && typeof item.name === 'string' && isFiniteNumber(item.close)
    && isFiniteNumber(item.change) && isFiniteNumber(item.changePercent)
    && isFiniteNumber(item.tradingAmount) && isFiniteNumber(item.tradingVolume)
}

const isRankings = (value: unknown): value is OfficialMarketRankings => {
  if (!value || typeof value !== 'object') return false
  const rankings = value as Partial<OfficialMarketRankings>
  return [rankings.tradingAmount, rankings.tradingVolume, rankings.gainers, rankings.losers]
    .every((items) => Array.isArray(items) && items.every(isRankingItem))
}

export const isOfficialMarketOverview = (value: unknown): value is OfficialMarketOverview => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<OfficialMarketOverview>
  const nullableCount = (count: unknown) => count === null || isNonNegativeInteger(count)
  const validHistory = Array.isArray(candidate.tradingHistory) && candidate.tradingHistory.every((point) =>
    typeof point.tradeDate === 'string' && isFiniteNumber(point.indexValue)
    && isFiniteNumber(point.tradingAmount) && isFiniteNumber(point.tradingVolume) && isFiniteNumber(point.transactionCount))
  return candidate.schemaVersion === '2.0' && candidate.market === 'TWSE'
    && typeof candidate.tradeDate === 'string' && typeof candidate.indexName === 'string'
    && isFiniteNumber(candidate.indexValue) && isFiniteNumber(candidate.change) && isFiniteNumber(candidate.changePercent)
    && isFiniteNumber(candidate.tradingAmount) && isFiniteNumber(candidate.tradingVolume) && isFiniteNumber(candidate.transactionCount)
    && nullableCount(candidate.advanceCount) && nullableCount(candidate.declineCount) && nullableCount(candidate.unchangedCount)
    && nullableCount(candidate.limitUpCount) && nullableCount(candidate.limitDownCount)
    && ['twtazu_od', 'stock_day_all'].includes(candidate.breadthSource ?? '')
    && validHistory && isRankings(candidate.rankings)
    && typeof candidate.source === 'string' && typeof candidate.fetchedAt === 'string'
    && ['official', 'partial', 'fallback'].includes(candidate.status ?? '') && Array.isArray(candidate.warnings)
}
