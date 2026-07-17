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

const todayPresetIds = new Set(['strong-trend', 'breakout-volume', 'macd-golden-cross', 'institution-technical'])
const riskPenalty = { low: 0, medium: 6, high: 18 }

export function todayRecommendationScore(result: ScreenerResult) {
  const decision = result.decisionScore ?? 0
  const technical = result.technicalScore ?? 0
  return decision * .5 + technical * .35 + result.confidence * .15 - riskPenalty[result.riskLevel]
}

export function selectTodayRecommendations(results: ScreenerResult[], limit = 3) {
  const bestBySymbol = new Map<string, ScreenerResult>()
  for (const result of results) {
    if (!result.matched || !todayPresetIds.has(result.presetId) || result.technicalScore === null || result.decisionScore === null || result.stale) continue
    const current = bestBySymbol.get(result.symbol)
    if (!current || todayRecommendationScore(result) > todayRecommendationScore(current)) bestBySymbol.set(result.symbol, result)
  }
  return [...bestBySymbol.values()]
    .sort((left, right) => todayRecommendationScore(right) - todayRecommendationScore(left) || left.symbol.localeCompare(right.symbol))
    .slice(0, Math.max(0, limit))
}

export function buildTodayRecommendationSignals(result: ScreenerResult) {
  const signals: string[] = []
  if (result.aboveMa20 === true) signals.push('站上 MA20')
  if ((result.macdHistogram ?? 0) > 0 || result.presetId === 'macd-golden-cross') signals.push('MACD 動能改善')
  if ((result.institutionalNet ?? 0) > 0) signals.push('法人買超')
  if (result.rsi14 !== null) signals.push(`RSI ${Math.round(result.rsi14)}`)
  if ((result.volumeRatio ?? 0) >= 1.5) signals.push(`量比 ${result.volumeRatio!.toFixed(1)} 倍`)
  return signals.slice(0, 4)
}
