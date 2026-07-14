export type InsightDirection = 'positive' | 'neutral' | 'warning'
export type RiskLevel = '低' | '中' | '高'

export interface MarketHeadlineResult {
  headline: string
  tags: string[]
  marketState: string
  confidence: number
  updatedAt: string
  reasons: string[]
}

export interface MarketHighlight {
  id: string
  type: '最強產業' | '最弱產業' | '法人異常' | '成交量異常' | '突破訊號' | '高風險訊號' | '重要事件'
  title: string
  description: string
  related: string[]
  intensity: number
  direction: InsightDirection
  riskLevel: RiskLevel
  targetPath: string
}

export type HealthFactorKey = 'trend' | 'momentum' | 'institutional' | 'volumePrice' | 'chips' | 'riskControl'

export interface HealthFactor {
  key: HealthFactorKey
  label: string
  score: number
  weight: number
  industryAverage: number
  explanation: string
}

export interface SupportResistanceLevel {
  type: '支撐' | '壓力'
  order: 1 | 2
  price: number
  distancePercent: number
  strength: '弱' | '中' | '強'
  isNear: boolean
}

export interface StockRiskAlert {
  id: string
  label: '漲幅過大' | '成交量失速' | '法人轉賣' | '高波動' | '接近壓力' | '跌破支撐' | '產業轉弱' | '籌碼不穩'
  severity: RiskLevel
  reason: string
  condition: string
  advice: string
}

export interface StockHealthResult {
  totalScore: number
  grade: '強勢' | '偏多' | '中性' | '偏弱' | '弱勢'
  factors: HealthFactor[]
  supportResistance: SupportResistanceLevel[]
  risks: StockRiskAlert[]
  summary: string
}

export type WatchlistAlertType = '最強' | '最弱' | '法人轉買' | '法人轉賣' | '接近觀察價' | '接近停損' | '接近停利' | '高風險'

export interface WatchlistAlert {
  id: string
  type: WatchlistAlertType
  symbol: string
  title: string
  description: string
  severity: RiskLevel
}
