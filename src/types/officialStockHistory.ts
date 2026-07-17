export type StockHistoryStatus = 'official' | 'partial' | 'stale' | 'invalid'

export interface OfficialStockHistoryPrice {
  tradeDate: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  change: number | null
  volume: number | null
  tradingAmount: number | null
  transactionCount: number | null
}

export interface OfficialStockHistory {
  schemaVersion: '1.0'
  symbol: string
  name: string
  market: 'TWSE'
  source: 'TWSE'
  sourceUrl: string
  fetchedAt: string
  firstTradeDate: string | null
  lastTradeDate: string | null
  recordCount: number
  status: StockHistoryStatus
  warnings: string[]
  prices: OfficialStockHistoryPrice[]
}

export interface StockHistoryTechnicalSummary {
  aboveMa20: boolean | null
  rsiOverbought: boolean | null
  macdGoldenCross: boolean | null
  volumeExpansion: boolean | null
  indicatorComputable: boolean
}

export interface StockHistoryIndexItem {
  symbol: string
  name: string
  path: string
  firstTradeDate: string | null
  lastTradeDate: string | null
  recordCount: number
  status: StockHistoryStatus
  stale: boolean
  warnings: string[]
  technical: StockHistoryTechnicalSummary
}

export interface StockHistoryIndex {
  schemaVersion: '1.0'
  source: 'TWSE'
  updatedAt: string
  targetTradingDays: number
  symbols: StockHistoryIndexItem[]
  summary: {
    availableSymbols: number
    averageRecordCount: number
    complete250Count: number
    staleCount: number
    failedSymbols: string[]
    technicalSampleSize: number
    aboveMa20Count: number
    rsiOverboughtCount: number
    macdGoldenCrossCount: number
    volumeExpansionCount: number
  }
}

export interface StockHistoryDatasetStatus {
  available: boolean
  source: 'TWSE'
  updatedAt: string | null
  availableSymbols: number
  averageRecordCount: number
  complete250Percent: number
  indicatorComputablePercent: number
  staleCount: number
  failedSymbols: string[]
  warnings: string[]
}

