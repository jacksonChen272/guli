export type SnapshotSourceType = 'official' | 'mock' | 'derived' | 'fallback'
export type SnapshotMarketStatus = '極弱' | '偏弱' | '中性' | '偏強' | '極強'

export interface SnapshotSource { id: string; name: string; type: SnapshotSourceType; fields: string[]; tradeDate?: string; status?: string }
export interface MarketSnapshotOverview { indexValue: number | null; change: number | null; changePercent: number | null; tradingAmount: number | null; advanceCount: number | null; declineCount: number | null; unchangedCount: number | null }
export interface MarketSnapshotIndustry { name: string; changePercent: number; capitalFlow: number; momentum: number; rank: number; source: SnapshotSourceType }
export interface MarketSnapshotRisk { id: string; level: '低' | '中' | '高'; title: string; description: string; source: SnapshotSourceType }
export interface MarketSnapshot {
  schemaVersion: '1.0'; snapshotId: string; tradeDate: string; generatedAt: string; market: 'TWSE'
  marketStatus: SnapshotMarketStatus; marketTemperature: number; confidence: number; headline: string
  stockBreadth?: { strongCount: number; weakCount: number; highRiskCount: number } | null
  overview: MarketSnapshotOverview; topIndustries: MarketSnapshotIndustry[]; weakIndustries: MarketSnapshotIndustry[]
  risks: MarketSnapshotRisk[]; tags: string[]; sources: SnapshotSource[]; warnings: string[]
}
export interface SnapshotValueDiff { current: number | null; previous: number | null; change: number | null }
export interface MarketSnapshotDiff {
  hasPrevious: boolean; currentDate: string; previousDate: string | null
  temperature: SnapshotValueDiff; index: SnapshotValueDiff; tradingAmount: SnapshotValueDiff
  marketStatusChanged: boolean; previousMarketStatus: SnapshotMarketStatus | null; currentMarketStatus: SnapshotMarketStatus
  addedTopIndustries: string[]; removedTopIndustries: string[]; addedWeakIndustries: string[]; removedWeakIndustries: string[]
}
export interface MarketMemory {
  requestedDays: number; snapshotCount: number; bullishDays: number; neutralDays: number; bearishDays: number
  averageTemperature: number | null; highestTemperature: { date: string; value: number } | null; lowestTemperature: { date: string; value: number } | null
  mostFrequentStrongIndustry: { name: string; count: number } | null; mostFrequentWeakIndustry: { name: string; count: number } | null; insufficientData: boolean
}
export interface SnapshotIndexItem { tradeDate: string; path: string; marketStatus: SnapshotMarketStatus; marketTemperature: number; headline: string }
export interface SnapshotIndex { schemaVersion: '1.0'; updatedAt: string; snapshots: SnapshotIndexItem[] }
