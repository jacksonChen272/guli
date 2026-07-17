export interface DataCoverageReport {
  marketOfficialPercent: number
  stockOfficialPercent: number
  institutionalOfficialPercent: number
  industryOfficialPercent: number
  historyDays: number
  historyStockCoverageCount: number
  historyAverageDays: number
  historyComplete250Percent: number
  indicatorComputablePercent: number
  historyStaleCount: number
  historyFailedSymbols: string[]
  totalCommonStocks: number
  historyComplete250Count: number
  technicalIndexCount: number
  technicalScoreAvailableCount: number
  decisionJoinCount: number
  institutionalJoinCount: number
  alignedCount: number
  mismatchedCount: number
  backfillCompleted: number
  backfillTotal: number
  backfillStatus: string
  mockFields: string[]
  derivedFields: string[]
  missingFields: string[]
  updatedAt: string | null
  stale: boolean
}
