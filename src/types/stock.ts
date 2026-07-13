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
  healthScore: number
  institutions: InstitutionalFlow
  capitalFlow: number
  momentum: number
  cumulative20d: number
  priceHistory: PricePoint[]
}
