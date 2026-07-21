export type PriceZoneType = 'support' | 'resistance'
export type PriceZoneStrength = 'weak' | 'medium' | 'strong'
export type TrendStructure = '多頭排列' | '偏多結構' | '盤整' | '偏空結構' | '空頭排列' | '資料不足'

export interface PricePivot {
  tradeDate: string
  price: number
  type: 'high' | 'low'
  window: number
}

export interface PriceZone {
  id: string
  type: PriceZoneType
  lower: number
  upper: number
  center: number
  strength: PriceZoneStrength
  touchCount: number
  lastTouchedAt: string | null
  distancePercent: number
  sources: string[]
}

export interface TrendStructureResult {
  classification: TrendStructure
  evidence: string[]
  values: {
    close: number | null
    ma5: number | null
    ma20: number | null
    ma60: number | null
    ma120: number | null
    ma20Slope: number | null
    ma60Slope: number | null
    high20: number | null
    low20: number | null
    macdHistogram: number | null
  }
}

export interface SupportResistanceAnalysis {
  formulaVersion: 'support-resistance-v1.0'
  tradeDate: string | null
  currentPrice: number | null
  atr14: number | null
  zones: PriceZone[]
  supports: PriceZone[]
  resistances: PriceZone[]
  pivots: PricePivot[]
  trend: TrendStructureResult
  sampleSize: number
  warnings: string[]
}
