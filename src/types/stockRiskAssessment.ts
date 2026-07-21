export type StockRiskSeverity = 'low' | 'medium' | 'high'
export type StockRiskCategory = 'momentum' | 'volatility' | 'volume' | 'price-structure' | 'institutional' | 'industry' | 'consistency' | 'data-quality'

export interface StockRiskAssessmentItem {
  id: string
  title: string
  severity: StockRiskSeverity
  category: StockRiskCategory
  explanation: string
  evidence: Record<string, number | string | boolean | null>
  tradeDate: string | null
  source: string
  formulaVersion: 'stock-risk-v1.0'
}

export interface StockRiskAssessmentInput {
  tradeDate: string | null
  close: number | null
  rsi14: number | null
  k: number | null
  d: number | null
  atr14: number | null
  volatility20: number | null
  volumeRatio: number | null
  ma20: number | null
  ma60: number | null
  nearestResistanceDistancePercent: number | null
  institutionalNetShares: number | null
  industryStrength: number | null
  decisionScore: number | null
  technicalScore: number | null
  dateMismatch: boolean
  stale: boolean
  historyRecordCount: number
}
