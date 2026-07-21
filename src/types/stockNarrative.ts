export type StockNarrativeStance = '偏多' | '中性' | '偏空' | '資料不足'

export interface StockNarrativeFactor {
  code: string
  label: string
  direction: 'positive' | 'neutral' | 'negative'
  explanation: string
  source: string
  tradeDate: string | null
}

export interface StockNarrativeInput {
  symbol: string
  name: string
  tradeDate: string | null
  decisionScore: number | null
  technicalScore: number | null
  healthScore: number | null
  snapshotScore: number | null
  close: number | null
  ma20: number | null
  ma60: number | null
  rsi14: number | null
  macdHistogram: number | null
  volumeRatio: number | null
  institutionalNetShares: number | null
  industryRelativeStrength: number | null
  highRiskCount: number
  stale: boolean
}

export interface StockNarrativeResult {
  formulaVersion: 'stock-narrative-v1.0'
  stance: StockNarrativeStance
  headline: string
  summary: string
  positiveFactors: StockNarrativeFactor[]
  riskFactors: StockNarrativeFactor[]
  observation: string
  tradeDate: string | null
  confidence: number
  warnings: string[]
}
