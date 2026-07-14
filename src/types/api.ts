import type { Industry } from './industry'
import type { InstitutionalFlow, MarketEvent, MarketIndex, MarketTemperatureData } from './market'
import type { Stock } from './stock'
import type { MarketFieldSource, OfficialMarketOverview } from './marketData'

export type DataStatus = 'loading' | 'success' | 'empty' | 'error' | 'stale'

export interface DataResult<T> {
  data: T
  source: string
  updatedAt: string
  status: DataStatus
  warnings: string[]
}

export interface MarketOverviewData {
  indices: MarketIndex[]
  tradingAmount: { value: number; change: number; changePercent: number; previousValue: number; trend: Array<{ date: string; value: number }> }
  institutionalFlows: Record<'foreign' | 'trust' | 'dealer', { value: number; change: number; changePercent: number; previousValue: number; trend: Array<{ date: string; value: number }> }>
  temperature: MarketTemperatureData
  officialMarket?: OfficialMarketOverview
  fieldSources?: {
    taiex: MarketFieldSource
    tradingAmount: MarketFieldSource
    marketBreadth: MarketFieldSource
    institutions: MarketFieldSource
  }
}

export type ProviderMarketOverview = MarketOverviewData | OfficialMarketOverview

export interface InstitutionalTradeRecord {
  symbol: string
  date: string
  flow: InstitutionalFlow
}

export interface RawMarketRecord {
  symbol?: unknown
  date?: unknown
  price?: unknown
  volume?: unknown
  institutionalFlow?: unknown
  source?: unknown
  updatedAt?: unknown
}

export type ProviderStockResult = DataResult<Stock[]>
export type ProviderIndustryResult = DataResult<Industry[]>
export type ProviderEventResult = DataResult<MarketEvent[]>
