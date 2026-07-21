import type { DecisionDirection } from './decision'

export type MarketSentimentLevel = 'extreme-fear' | 'bearish' | 'neutral' | 'bullish' | 'optimistic'
export type MarketSentimentSourceType = 'official' | 'derived' | 'missing'

export interface MarketSentimentFactor {
  id: 'market-decision' | 'breadth' | 'foreign-flow' | 'turnover' | 'decision-summary'
  label: string
  score: number | null
  weight: number
  contribution: number | null
  explanation: string
  sourceType: MarketSentimentSourceType
}

export interface MarketSentimentResult {
  score: number | null
  level: MarketSentimentLevel
  label: string
  confidence: number
  formulaVersion: 'market-sentiment-v1'
  tradeDate: string | null
  factors: MarketSentimentFactor[]
  warnings: string[]
}

export interface TodaySummaryResult {
  text: string
  stance: DecisionDirection
  tags: string[]
  reasons: string[]
  formulaVersion: 'today-summary-v1.0'
  tradeDate: string | null
}

export interface HotStockItem {
  symbol: string
  name: string
  close: number | null
  changePercent: number | null
  tradingAmount: number | null
  tradingVolume: number | null
  hotScore: number
  rank: number
  reasons: string[]
  tradeDate: string
  source: 'TWSE Official'
}

export interface WatchlistPreviewItem {
  symbol: string
  name: string
  close: number | null
  changePercent: number | null
  tradeDate: string | null
  source: 'TWSE Official' | 'Missing'
}

export type DashboardWidgetId =
  | 'hero'
  | 'sentiment'
  | 'summary'
  | 'hot-stocks'
  | 'recent-search'
  | 'watchlist'
  | 'recommendations'
  | 'heatmap'
  | 'industry-rotation'
  | 'technical-opportunities'
  | 'twse-rankings'
  | 'today-events'
  | 'data-coverage'

