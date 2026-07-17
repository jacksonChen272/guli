import { classifyTechnicalScore, technicalScoreFormulaVersion, technicalScoreLabels, technicalScoreWeights, type TechnicalFactorId } from '../../config/technicalScoreFormula'
import type { TechnicalIndexEntry, TechnicalScoreFactor, TechnicalScoreResult } from '../../types/screener'

const clamp = (value: number) => Math.max(0, Math.min(100, value))
const average = (values: Array<number | null>) => {
  const available = values.filter((value): value is number => value !== null && Number.isFinite(value))
  return available.length ? available.reduce((sum, value) => sum + value, 0) / available.length : null
}
const binary = (condition: boolean | null, positive = 80, negative = 30) => condition === null ? null : condition ? positive : negative
const compare = (left: number | null, right: number | null, positive = 80, negative = 30) => left === null || right === null ? null : binary(left > right, positive, negative)

function factorScores(entry: TechnicalIndexEntry): Record<TechnicalFactorId, { score: number | null; reasons: string[] }> {
  const trend = average([
    compare(entry.close, entry.ma20), compare(entry.close, entry.ma60), binary(entry.ma20Slope === null ? null : entry.ma20Slope > 0),
    binary(entry.ma60Slope === null ? null : entry.ma60Slope > 0), compare(entry.ma5, entry.ma20),
  ])
  const rsiScore = entry.rsi14 === null ? null : entry.rsi14 >= 55 && entry.rsi14 <= 75 ? 82 : entry.rsi14 > 80 ? 32 : entry.rsi14 < 35 ? 38 : 60
  const momentum = average([rsiScore, compare(entry.k, entry.d, 75, 38), entry.return20 === null ? null : clamp(50 + entry.return20 * 2.5)])
  const volume = entry.volumeRatio === null || entry.changePercent === null ? null : clamp(50 + Math.min(entry.volumeRatio, 3) * 14 + Math.sign(entry.changePercent) * 12)
  const macd = average([compare(entry.macd, entry.macdSignal, 78, 35), entry.macdHistogram === null ? null : clamp(50 + entry.macdHistogram * 8)])
  const position = entry.close === null || entry.bollingerUpper === null || entry.bollingerLower === null || entry.bollingerUpper === entry.bollingerLower
    ? null : clamp(100 - Math.abs(((entry.close - entry.bollingerLower) / (entry.bollingerUpper - entry.bollingerLower)) - 0.68) * 95)
  const atrPercent = entry.atr14 === null || entry.close === null || entry.close <= 0 ? null : entry.atr14 / entry.close * 100
  const risk = average([
    entry.volatility20 === null ? null : clamp(100 - Math.max(0, entry.volatility20 - 15) * 1.7),
    atrPercent === null ? null : clamp(100 - Math.max(0, atrPercent - 1.5) * 18),
    entry.rsi14 === null ? null : entry.rsi14 >= 80 ? 25 : entry.rsi14 >= 70 ? 55 : 82,
    binary(entry.aboveMa20, 82, 38), binary(entry.aboveMa60, 85, 32),
  ])
  return {
    trend: { score: trend, reasons: [`收盤${entry.aboveMa20 ? '高於' : '未高於'} MA20`, `MA20 斜率${(entry.ma20Slope ?? 0) > 0 ? '向上' : '未向上'}`] },
    momentum: { score: momentum, reasons: [`RSI14 ${entry.rsi14?.toFixed(1) ?? '資料不足'}`, `20 日報酬 ${entry.return20?.toFixed(2) ?? '資料不足'}%`] },
    volume: { score: volume, reasons: [`量比 ${entry.volumeRatio?.toFixed(2) ?? '資料不足'} 倍`] },
    macd: { score: macd, reasons: [`MACD 柱狀體 ${entry.macdHistogram?.toFixed(3) ?? '資料不足'}`] },
    position: { score: position, reasons: ['依布林通道與 20 日區間相對位置評估'] },
    risk: { score: risk, reasons: [`20 日波動率 ${entry.volatility20?.toFixed(2) ?? '資料不足'}%`, `ATR/收盤 ${atrPercent?.toFixed(2) ?? '資料不足'}%`] },
  }
}

export function calculateTechnicalScore(entry: TechnicalIndexEntry): TechnicalScoreResult {
  const scores = factorScores(entry)
  const availableWeight = (Object.keys(technicalScoreWeights) as TechnicalFactorId[]).reduce((sum, id) => sum + (scores[id].score === null ? 0 : technicalScoreWeights[id]), 0)
  const canScore = availableWeight >= 0.5
  const factors: TechnicalScoreFactor[] = (Object.keys(technicalScoreWeights) as TechnicalFactorId[]).map((id) => {
    const score = scores[id].score
    const normalizedWeight = score === null || !canScore ? 0 : technicalScoreWeights[id] / availableWeight
    return { id, label: technicalScoreLabels[id], score: score === null ? null : Number(clamp(score).toFixed(2)), weight: technicalScoreWeights[id], normalizedWeight, contribution: score === null || !canScore ? null : Number((score * normalizedWeight).toFixed(2)), reasons: scores[id].reasons }
  })
  const score = canScore ? Number(clamp(factors.reduce((sum, factor) => sum + (factor.contribution ?? 0), 0)).toFixed(1)) : null
  return { score, label: classifyTechnicalScore(score), confidence: Math.round(availableWeight * 100), availableWeight, formulaVersion: technicalScoreFormulaVersion, factors, warnings: canScore ? [] : ['可用技術因子權重低於 50%，不產生 Technical Score。'] }
}
