import type { ScreenerPresetId, ScreenerPresetSummary, ScreenerResult } from '../../types/screener'
import { getScreenerPreset } from './ScreenerPresetService'

const mean = (values: Array<number | null>) => { const rows = values.filter((value): value is number => value !== null); return rows.length ? Number((rows.reduce((sum, value) => sum + value, 0) / rows.length).toFixed(1)) : null }

export function summarizePreset(id: ScreenerPresetId, results: ScreenerResult[], sampleCount: number): ScreenerPresetSummary {
  const preset = getScreenerPreset(id)
  const matched = results.filter((row) => row.presetId === id && row.matched)
  return { presetId: id, name: preset.name, description: preset.description, matchedCount: matched.length, averageTechnicalScore: mean(matched.map((row) => row.technicalScore)), averageConfidence: mean(matched.map((row) => row.confidence)), completenessPercent: sampleCount ? Math.round(matched.filter((row) => row.missingFields.length === 0).length / sampleCount * 100) : 0 }
}

export function exportScreenerCsv(results: ScreenerResult[]) {
  const escape = (value: string | number | null) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const header = ['排名', '代號', '名稱', '日期', 'Technical Score', 'Decision', 'Confidence', 'RSI', 'MACD', '量比', '風險', '主要理由']
  return [header.map(escape).join(','), ...results.map((row) => [row.rank, row.symbol, row.name, row.tradeDate, row.technicalScore, row.decisionScore, row.confidence, row.rsi14, row.macdHistogram, row.volumeRatio, row.riskLevel, row.reasons[0] ?? ''].map(escape).join(','))].join('\n')
}
