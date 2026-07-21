import type { SearchCoverage, SearchDataState, SearchScore } from '../../types/search'

export const finiteOrNull = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null

export const scoreStatus = (value: unknown, expected: boolean): SearchScore => {
  const score = finiteOrNull(value)
  return { value: score, state: score !== null ? 'available' : expected ? 'waiting' : 'missing' }
}

export const availability = (available: boolean, expected = true): SearchDataState => available ? 'available' : expected ? 'waiting' : 'missing'

const percent = (value: number, total: number) => total > 0 ? Number((value / total * 100).toFixed(1)) : 0

export function calculateSearchCoverage(input: {
  totalStocks: number
  officialStocks: number
  historyStocks: number
  technicalStocks: number
  decisionStocks: number
  snapshotStocks: number
  updatedAt: string | null
}): SearchCoverage {
  const totalStocks = Math.max(0, input.totalStocks)
  const bounded = (value: number) => Math.min(totalStocks, Math.max(0, value))
  const officialStocks = bounded(input.officialStocks)
  const historyStocks = bounded(input.historyStocks)
  const technicalStocks = bounded(input.technicalStocks)
  const decisionStocks = bounded(input.decisionStocks)
  const snapshotStocks = bounded(input.snapshotStocks)
  return {
    totalStocks,
    officialStocks,
    historyStocks,
    technicalStocks,
    decisionStocks,
    snapshotStocks,
    officialPercent: percent(officialStocks, totalStocks),
    historyPercent: percent(historyStocks, totalStocks),
    technicalPercent: percent(technicalStocks, totalStocks),
    decisionPercent: percent(decisionStocks, totalStocks),
    snapshotPercent: percent(snapshotStocks, totalStocks),
    updatedAt: input.updatedAt,
  }
}

export const displayNumber = (value: number | null, formatter: (number: number) => string) => value === null || !Number.isFinite(value) ? '等待資料' : formatter(value)
