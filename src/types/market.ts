export type InstitutionType = 'all' | 'foreign' | 'trust' | 'dealer'
export type Period = 1 | 5 | 10 | 20
export type MarketBoard = 'all' | 'listed' | 'otc'
export type RotationMode = 'industry' | 'stock'

export interface PricePoint {
  date: string
  value: number
  volume?: number
}

export interface MarketIndex {
  code: string
  name: string
  value: number
  change: number
  changePercent: number
  previousValue: number
  trend: PricePoint[]
}

export interface InstitutionalFlow {
  foreign: number
  trust: number
  dealer: number
  total: number
}

export interface RotationPoint {
  id: string
  name: string
  industry: string
  capitalFlow: number
  momentum: number
  cumulative20d: number
  changePercent: number
  price?: number
  healthScore: number
  institutions: InstitutionalFlow
  history: Array<{ date: string; capitalFlow: number; momentum: number }>
}

export interface MarketSignal {
  id: string
  type: '資金' | '籌碼' | '動能' | '風險' | '產業'
  title: string
  description: string
  intensity: number
  industries: string[]
}

export interface MarketEvent {
  id: string
  time: string
  category: string
  title: string
  source: string
}

export interface MarketTemperatureData {
  score: number
  weather: '晴天' | '多雲' | '陣雨' | '雷雨'
  reasons: Array<{ label: string; value: number; description: string }>
}
