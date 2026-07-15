export type StockInstrumentType = 'stock' | 'etf' | 'etn' | 'warrant' | 'unknown'
export type StockDataSource = 'TWSE'
export type StockDataWarning = string

export interface OfficialStockDailyRecord {
  symbol: string
  name: string
  tradeDate: string
  market: 'TWSE'
  instrumentType: StockInstrumentType
  tradeVolume: number | null
  transactionCount: number | null
  tradeValue: number | null
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  changeDirection: 'up' | 'down' | 'flat' | 'none'
  change: number | null
  bidPrice: number | null
  bidVolume: number | null
  askPrice: number | null
  askVolume: number | null
  peRatio: number | null
  source: StockDataSource
  fetchedAt: string
  status: 'official' | 'partial' | 'invalid'
  warnings: StockDataWarning[]
}

export interface OfficialStockDailyDataset {
  schemaVersion: '1.0'
  market: 'TWSE'
  tradeDate: string
  fetchedAt: string
  records: OfficialStockDailyRecord[]
  source: { name: string; endpoint: string }
  status: 'official' | 'partial'
  warnings: string[]
}

export interface OfficialStockDatasetIndexItem { tradeDate: string; path: string; recordCount: number; status: 'official' | 'partial' }
export interface OfficialStockDatasetIndex { schemaVersion: '1.0'; updatedAt: string; datasets: OfficialStockDatasetIndexItem[] }
export interface OfficialStockDatasetStatus { available: boolean; tradeDate: string | null; fetchedAt: string | null; recordCount: number; status: 'official' | 'partial' | 'invalid' | 'missing'; stale: boolean; warnings: string[]; instrumentCounts: Record<StockInstrumentType, number> }

export interface CombinedStockData {
  quote: OfficialStockDailyRecord | null
  institutional: 'mock'
  technicalIndicators: 'derived'
  healthScore: 'derived'
  fallback: boolean
  warnings: string[]
}
