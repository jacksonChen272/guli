import type { ScreenerFilters, ScreenerResult } from '../../types/screener'

const within = (value: number | null, min?: number, max?: number) => value !== null && (min === undefined || value >= min) && (max === undefined || value <= max)

export function filterScreenerResults(results: ScreenerResult[], filters: ScreenerFilters) {
  return results.filter((row) => {
    if ((filters.technicalScoreMin !== undefined || filters.technicalScoreMax !== undefined) && !within(row.technicalScore, filters.technicalScoreMin, filters.technicalScoreMax)) return false
    if ((filters.decisionScoreMin !== undefined || filters.decisionScoreMax !== undefined) && !within(row.decisionScore, filters.decisionScoreMin, filters.decisionScoreMax)) return false
    if ((filters.rsiMin !== undefined || filters.rsiMax !== undefined) && !within(row.rsi14, filters.rsiMin, filters.rsiMax)) return false
    if (filters.volumeRatioMin !== undefined && !within(row.volumeRatio, filters.volumeRatioMin)) return false
    if (filters.aboveMa20 !== undefined && row.aboveMa20 !== filters.aboveMa20) return false
    if (filters.aboveMa60 !== undefined && row.aboveMa60 !== filters.aboveMa60) return false
    if (filters.macdState && (row.macdHistogram === null || (filters.macdState === 'positive' ? row.macdHistogram < 0 : row.macdHistogram >= 0))) return false
    if (filters.institutionalState && (row.institutionalNet === null || (filters.institutionalState === 'buy' ? row.institutionalNet <= 0 : row.institutionalNet >= 0))) return false
    if (filters.kdState && (row.k === null || row.d === null || (filters.kdState === 'bullish' ? row.k < row.d : row.k >= row.d))) return false
    if (filters.return20Min !== undefined && !within(row.return20, filters.return20Min)) return false
    if (filters.return60Min !== undefined && !within(row.return60, filters.return60Min)) return false
    if (filters.volatilityMax !== undefined && !within(row.volatility20, undefined, filters.volatilityMax)) return false
    if (filters.completenessMin !== undefined && row.historyRecordCount < filters.completenessMin) return false
    if (filters.stale !== undefined && row.stale !== filters.stale) return false
    if (filters.excludeHighRisk && row.riskLevel === 'high') return false
    if (filters.officialOnly && row.sourceSummary.some((source) => source.includes('Missing') || source.includes('Mock'))) return false
    return true
  })
}

export function searchScreenerResults(results: ScreenerResult[], query: string) {
  const term = query.trim().toLocaleLowerCase('zh-TW')
  if (!term) return results
  return results.filter((row) => [row.symbol, row.name, ...row.reasons, ...row.matchedRules].some((value) => value.toLocaleLowerCase('zh-TW').includes(term)))
}
