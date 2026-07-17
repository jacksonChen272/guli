import type { ScreenerResult } from '../../types/screener'

export type ScreenerSortKey = 'rank' | 'technicalScore' | 'decisionScore' | 'confidence' | 'changePercent' | 'volumeRatio' | 'riskLevel'
const riskValue = { low: 1, medium: 2, high: 3 }

export function rankScreenerResults(results: ScreenerResult[], key: ScreenerSortKey = 'technicalScore', direction: 'asc' | 'desc' = 'desc') {
  const sorted = [...results].sort((left, right) => {
    const leftValue = key === 'riskLevel' ? riskValue[left.riskLevel] : key === 'rank' ? left.rank : left[key] ?? -Infinity
    const rightValue = key === 'riskLevel' ? riskValue[right.riskLevel] : key === 'rank' ? right.rank : right[key] ?? -Infinity
    return (Number(rightValue) - Number(leftValue)) * (direction === 'desc' ? 1 : -1) || left.symbol.localeCompare(right.symbol)
  })
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }))
}

export function paginateScreenerResults(results: ScreenerResult[], page: number, pageSize = 25) {
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const safePage = Math.max(1, Math.min(page, totalPages))
  return { page: safePage, pageSize, total: results.length, totalPages, rows: results.slice((safePage - 1) * pageSize, safePage * pageSize) }
}
