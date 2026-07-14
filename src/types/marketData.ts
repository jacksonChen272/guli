export type OfficialMarketStatus = 'official' | 'partial' | 'fallback'

export interface OfficialMarketOverview {
  market: 'TWSE'
  tradeDate: string
  indexName: string
  indexValue: number
  change: number
  changePercent: number
  tradingAmount: number
  advanceCount: number | null
  declineCount: number | null
  unchangedCount: number | null
  source: string
  sourceUrl?: string
  fetchedAt: string
  status: OfficialMarketStatus
  warnings: string[]
}

export type MarketFieldSource = 'official' | 'mock' | 'fallback' | 'partial'

export const isOfficialMarketOverview = (value: unknown): value is OfficialMarketOverview => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<OfficialMarketOverview>
  const nullableCount = (count: unknown) => count === null || typeof count === 'number'
  return candidate.market === 'TWSE' && typeof candidate.tradeDate === 'string' && typeof candidate.indexName === 'string'
    && typeof candidate.indexValue === 'number' && typeof candidate.change === 'number' && typeof candidate.changePercent === 'number'
    && typeof candidate.tradingAmount === 'number' && nullableCount(candidate.advanceCount) && nullableCount(candidate.declineCount)
    && nullableCount(candidate.unchangedCount) && typeof candidate.source === 'string' && typeof candidate.fetchedAt === 'string'
    && ['official', 'partial', 'fallback'].includes(candidate.status ?? '') && Array.isArray(candidate.warnings)
}
