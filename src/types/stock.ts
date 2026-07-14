import type { InstitutionalFlow, MarketBoard, PricePoint } from './market'

export interface Stock {
  symbol: string
  name: string
  industry: string
  board: Exclude<MarketBoard, 'all'>
  price: number
  change: number
  changePercent: number
  volume: number
  institutions: InstitutionalFlow
  institutionalHistory: Array<InstitutionalFlow & { date: string }>
  capitalFlow: number
  momentum: number
  cumulative20d: number
  rsi: number
  volatility: number
  marginChange: number
  industryStrength: number
  priceHistory: PricePoint[]
}

export interface WatchlistItem {
  symbol: string
  groupId: string
  note: string
  targetPrice?: number
  stopLossPrice?: number
  takeProfitPrice?: number
  createdAt: string
}

export interface WatchlistGroup {
  id: string
  name: string
}
