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

export interface StockHistoryBackfillProgress {
  totalSymbols: number
  completedSymbols: number
  failedSymbols: string[]
  skippedSymbols: number
  currentOffset: number
  lastCompletedSymbol: string | null
  startedAt: string
  updatedAt: string
  targetDays: number
  status: 'running' | 'completed' | 'partial'
}

export type StockHistoryManifestStatus = 'complete' | 'partial' | 'failed' | 'pending' | 'unsupported'

export interface StockHistoryManifestItem {
  symbol: string
  name: string
  status: StockHistoryManifestStatus
  recordCount: number
  firstDate: string | null
  lastDate: string | null
  lastUpdatedAt: string | null
  source: 'TWSE'
  isOfficial: boolean
  validationStatus: 'valid' | 'invalid' | 'pending' | 'unsupported'
  errors: string[]
  securityType: string
  eligibleForTechnical: boolean
  path: string | null
}

export interface StockHistoryManifest {
  schemaVersion: 'history-manifest-v1'
  updatedAt: string
  targetTradingDays: number
  technicalMinimumDays: number
  source: 'TWSE'
  storageRoot: 'data/twse-stock-history/stocks'
  summary: {
    total: number
    commonStocks: number
    complete: number
    partial: number
    failed: number
    pending: number
    unsupported: number
    officialValid: number
    technicalEligible: number
  }
  items: StockHistoryManifestItem[]
}

