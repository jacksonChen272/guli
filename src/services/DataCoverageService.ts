import type { DataCoverageReport } from '../types/dataCoverage'

export interface CoverageInput {
  marketAvailable: boolean
  stockRecords: number
  targetStocks: number
  institutionalRecords: number
  institutionalTarget: number
  industryOfficialRecords: number
  industryTarget: number
  historyDays: number
  historyStockCoverageCount?: number
  historyAverageDays?: number
  historyComplete250Percent?: number
  indicatorComputablePercent?: number
  historyStaleCount?: number
  historyFailedSymbols?: string[]
  updatedAt: string | null
  stale: boolean
}

const percent = (value: number, target: number) => target <= 0 ? 0 : Math.max(0, Math.min(100, Math.round(value / target * 100)))
const bounded = (value = 0) => Math.max(0, Math.min(100, Math.round(value)))

export function calculateDataCoverage(input: CoverageInput): DataCoverageReport {
  const institutional = percent(input.institutionalRecords, input.institutionalTarget)
  return {
    marketOfficialPercent: input.marketAvailable ? 100 : 0,
    stockOfficialPercent: percent(input.stockRecords, input.targetStocks),
    institutionalOfficialPercent: institutional,
    industryOfficialPercent: percent(input.industryOfficialRecords, input.industryTarget),
    historyDays: Math.max(0, input.historyDays),
    historyStockCoverageCount: Math.max(0, input.historyStockCoverageCount ?? 0),
    historyAverageDays: Math.max(0, input.historyAverageDays ?? input.historyDays),
    historyComplete250Percent: bounded(input.historyComplete250Percent),
    indicatorComputablePercent: bounded(input.indicatorComputablePercent),
    historyStaleCount: Math.max(0, input.historyStaleCount ?? 0),
    historyFailedSymbols: [...new Set(input.historyFailedSymbols ?? [])],
    updatedAt: input.updatedAt,
    stale: input.stale,
    mockFields: ['產業分類與產業相對強度', '部分健康分數法人長期資料', '資金輪動產業資料', '市場溫度部分因子'],
    derivedFields: ['Decision Score', 'Confidence', 'Snapshot Score', '技術指標與固定規則訊號', '漲幅 ≥ 9.5%／跌幅 ≤ -9.5% 衍生統計'],
    missingFields: [...(institutional ? [] : ['官方法人資料']), ...(input.historyStockCoverageCount ? [] : ['TWSE 官方個股歷史行情']), '官方產業分類與資金流向'],
  }
}
