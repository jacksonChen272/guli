export type HistoryFailureCategory =
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'NO_DATA'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'WRITE_ERROR'
  | 'UNKNOWN'

export type HistoryItemStatus = 'complete' | 'partial' | 'failed' | 'pending' | 'unsupported'

export interface HistoryPricePoint {
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

export interface TwseHistoryDataset {
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
  status: 'official' | 'partial' | 'stale' | 'invalid'
  warnings: string[]
  prices: HistoryPricePoint[]
}

export interface HistorySecurity {
  symbol: string
  name: string
  instrumentType: string
}

export interface HistoryFailure {
  symbol: string
  category: HistoryFailureCategory
  message: string
  attempts: number
  occurredAt: string
}

export interface HistoryProgress {
  version: 'history-progress-v1'
  startedAt: string
  updatedAt: string
  totalSymbols: number
  completedSymbols: string[]
  failedSymbols: HistoryFailure[]
  pendingSymbols: string[]
  lastProcessedSymbol: string | null
  status: 'idle' | 'running' | 'completed' | 'partial'
  phase?: string
  plannedSymbols?: string[]
  phaseCompletedSymbols?: string[]
  phaseStartedAt?: string
  phaseHistoryBytesBefore?: number
  phaseManifestBytesBefore?: number
  phaseCoverageBefore?: HistoryCoverageCounts
  phaseMetrics?: {
    executionSegments: number
    processedSymbols: number
    updatedSymbols: number
    skippedSymbols: number
    historicalRecordsAdded: number
    totalExecutionMs: number
    totalRetries: number
    errorCounts: Record<HistoryFailureCategory, number>
  }
}

export interface HistoryCoverageCounts {
  totalSecurities: number
  eligibleCommonStocks: number
  unsupportedSecurities: number
  complete: number
  partial: number
  pending: number
  failed: number
  technicalDataReady: number
}

export interface HistoryManifestItem {
  symbol: string
  name: string
  status: HistoryItemStatus
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
  technicalDataReady: boolean
  path: string | null
}

export interface HistoryManifest {
  schemaVersion: 'history-manifest-v1'
  updatedAt: string
  targetTradingDays: number
  technicalMinimumDays: number
  source: 'TWSE'
  storageRoot: 'data/twse-stock-history/stocks'
  summary: {
    totalSecurities: number
    eligibleCommonStocks: number
    unsupportedSecurities: number
    total: number
    commonStocks: number
    complete: number
    partial: number
    failed: number
    pending: number
    unsupported: number
    officialValid: number
    technicalEligible: number
    technicalReady: number
    coverageInvariantValid: boolean
  }
  items: HistoryManifestItem[]
}
