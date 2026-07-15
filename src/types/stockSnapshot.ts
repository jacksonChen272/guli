export type StockSnapshotStatus = '強勢' | '偏強' | '中性' | '偏弱' | '弱勢' | '資料不足'
export type StockSnapshotRiskCode = 'extreme_daily_gain' | 'extreme_daily_loss' | 'wide_daily_range' | 'close_near_low' | 'low_liquidity' | 'unusually_high_pe' | 'missing_ohlc' | 'missing_pe' | 'partial_official_data'
export interface StockSnapshotSource { type: 'official' | 'derived' | 'fallback'; name: string; field?: string }
export interface StockSnapshotRisk { code: StockSnapshotRiskCode; severity: 'low' | 'medium' | 'high'; title: string; reason: string; source: 'official' | 'derived' }
export interface StockSnapshotQuote { open: number | null; high: number | null; low: number | null; close: number | null; change: number | null; changePercent: number | null; tradeVolume: number | null; transactionCount: number | null; tradeValue: number | null; peRatio: number | null }
export interface StockSnapshotItem {
  symbol: string; name: string; tradeDate: string; market: 'TWSE'; instrumentType: 'stock'; quote: StockSnapshotQuote
  dailyRangePercent: number | null; turnoverAverageValue: number | null; pricePosition: number | null
  liquidityScore: number | null; priceStrengthScore: number | null; valuationRiskScore: number | null; snapshotScore: number | null
  status: StockSnapshotStatus; risks: StockSnapshotRisk[]; tags: string[]; sources: StockSnapshotSource[]; warnings: string[]
}
export interface StockSnapshotDataset { schemaVersion: '1.0'; market: 'TWSE'; tradeDate: string; generatedAt: string; records: StockSnapshotItem[]; sources: StockSnapshotSource[]; warnings: string[] }
export interface StockSnapshotIndexItem { symbol: string; name: string; close: number | null; changePercent: number | null; tradeValue: number | null; priceStrengthScore: number | null; liquidityScore: number | null; snapshotScore: number | null; status: StockSnapshotStatus; riskCount: number; highRiskCount: number }
export interface StockSnapshotDailyIndex { schemaVersion: '1.0'; market: 'TWSE'; tradeDate: string; generatedAt: string; recordCount: number; records: StockSnapshotIndexItem[]; sources: StockSnapshotSource[]; warnings: string[] }
export interface StockSnapshotArchiveIndex { schemaVersion: '1.0'; updatedAt: string; snapshots: Array<{ tradeDate: string; path: string; recordCount: number }> }
export interface StockSnapshotDiff { symbol: string; currentDate: string; previousDate: string | null; available: boolean; changes: { close: number | null; changePercent: number | null; tradeValue: number | null; peRatio: number | null; dailyRangePercent: number | null; snapshotScore: number | null; riskCount: number | null }; addedRisks: StockSnapshotRiskCode[]; removedRisks: StockSnapshotRiskCode[]; warnings: string[] }
export interface StockMemory { symbol: string; requestedDays: number; actualDays: number; fromDate: string | null; toDate: string | null; averageClose: number | null; cumulativeChangePercent: number | null; averageVolume: number | null; averageTradeValue: number | null; highestClose: number | null; lowestClose: number | null; biggestDailyRangePercent: number | null; riskFrequency: Partial<Record<StockSnapshotRiskCode, number>>; sufficient: boolean; warnings: string[] }
export type StockSnapshotRankingCriteria = 'snapshotScore' | 'priceStrength' | 'liquidity' | 'gainers' | 'losers' | 'tradeValue' | 'riskCount'
