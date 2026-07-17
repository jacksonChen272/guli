import type { OfficialStockHistoryPrice } from './officialStockHistory'

export interface IndicatorPoint {
  tradeDate: string
  value: number | null
  period: number
  source: 'GULI Derived'
}

export interface MacdPoint {
  tradeDate: string
  macd: number | null
  signal: number | null
  histogram: number | null
}

export interface StochasticPoint {
  tradeDate: string
  k: number | null
  d: number | null
}

export interface BollingerPoint {
  tradeDate: string
  upper: number | null
  middle: number | null
  lower: number | null
}

export interface TechnicalIndicatorSeries {
  source: 'GULI Derived from TWSE Official History'
  formulaVersion: 'technical-v1.0'
  sampleSize: number
  firstTradeDate: string | null
  lastTradeDate: string | null
  prices: OfficialStockHistoryPrice[]
  ma5: IndicatorPoint[]
  ma10: IndicatorPoint[]
  ma20: IndicatorPoint[]
  ma60: IndicatorPoint[]
  ma120: IndicatorPoint[]
  ema12: IndicatorPoint[]
  ema26: IndicatorPoint[]
  rsi14: IndicatorPoint[]
  stochastic: StochasticPoint[]
  macd: MacdPoint[]
  bollinger: BollingerPoint[]
  atr14: IndicatorPoint[]
  averageVolume20: IndicatorPoint[]
  volumeRatio20: IndicatorPoint[]
  return20: IndicatorPoint[]
  return60: IndicatorPoint[]
  volatility20: IndicatorPoint[]
}

export type TechnicalSignalDirection = 'positive' | 'negative' | 'neutral' | 'warning'
export type TechnicalSignalSeverity = 'info' | 'medium' | 'high'

export interface TechnicalSignal {
  id: string
  name: string
  direction: TechnicalSignalDirection
  severity: TechnicalSignalSeverity
  tradeDate: string
  explanation: string
  source: 'GULI Derived from TWSE Official History'
  evidence: Record<string, number | string | null>
  formulaVersion: 'technical-signal-v1.0'
}

export interface TechnicalSummaryItem {
  id: 'trend' | 'rsi' | 'kd' | 'macd' | 'volume' | 'volatility'
  label: string
  value: string
  status: string
  tradeDate: string | null
  period: string
  source: 'Derived'
  explanation: string
}

