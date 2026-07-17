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
  mockFields: string[]
  derivedFields: string[]
  missingFields: string[]
  updatedAt: string | null
  stale: boolean
}
