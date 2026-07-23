export type SearchResultKind = 'stock' | 'command'
export type SearchDataState = 'available' | 'waiting' | 'missing'

export interface SearchScore {
  value: number | null
  state: SearchDataState
}

export interface SearchStockIndexItem {
  kind: 'stock'
  id: string
  symbol: string
  name: string
  englishName: string | null
  industry: string
  market: 'TWSE'
  marketLabel: '上市'
  close: number | null
  changePercent: number | null
  tradeVolume: number | null
  tradeValue: number | null
  hasOfficialQuote: boolean
  hasHistory: boolean
  hasTechnical: boolean
  hasDecision: boolean
  hasSnapshot: boolean
  decisionScore: number | null
  technicalScore: number | null
  healthScore: number | null
  snapshotScore: number | null
  popularityScore: number
  tradeDate: string | null
}

export interface SearchCommandIndexItem {
  kind: 'command'
  id: string
  label: string
  description: string
  path: string
  keywords: string[]
  popularityScore: number
}

export type SearchIndexItem = SearchStockIndexItem | SearchCommandIndexItem

export interface RankedSearchResult {
  item: SearchIndexItem
  priority: 1 | 2 | 3 | 4 | 5
  matchedBy: string
}

export interface SearchIndexSnapshot {
  items: SearchStockIndexItem[]
  commands: SearchCommandIndexItem[]
  builtAt: string
  tradeDate: string | null
  coverage: SearchCoverage
}

export interface SearchCoverage {
  totalStocks: number
  officialStocks: number
  historyStocks: number
  technicalStocks: number
  decisionStocks: number
  snapshotStocks: number
  officialPercent: number
  historyPercent: number
  technicalPercent: number
  decisionPercent: number
  snapshotPercent: number
  updatedAt: string | null
}

export interface StockSearchPreview {
  stock: SearchStockIndexItem
  decision: SearchScore
  technical: SearchScore
  health: SearchScore
  snapshot: SearchScore
  officialData: SearchDataState
  history: SearchDataState
  volume: number | null
  warnings: string[]
}

export interface SearchIndexSourceRecord {
  symbol: string
  name: string
  englishName: string | null
  industry: string | null
  close: number | null
  changePercent: number | null
  tradeVolume: number | null
  tradeValue: number | null
  tradeDate: string | null
  hasOfficialQuote: boolean
  hasHistory: boolean
  hasTechnical: boolean
  hasDecision: boolean
  hasSnapshot: boolean
  decisionScore: number | null
  technicalScore: number | null
  healthScore: number | null
  snapshotScore: number | null
}

export interface DecisionDatasetSummary {
  tradeDate: string
  generatedAt: string
  stockCount: number
}
