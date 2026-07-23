import type { StockNarrativeInput, StockNarrativeResult, StockNarrativeStance } from '../../types/stockNarrative'
import { buildStockNarrativeFactors } from './StockNarrativeFactorService'
import { formatStockNarrativeHeadline, formatStockObservation } from './StockNarrativeFormatter'
import { buildStockNarrativeRisks } from './StockNarrativeRiskService'

const availableScores = (input: StockNarrativeInput) => [input.decisionScore, input.technicalScore, input.healthScore, input.snapshotScore].filter((value): value is number => value !== null)

export function generateStockNarrative(input: StockNarrativeInput): StockNarrativeResult {
  const scores = availableScores(input)
  const factors = buildStockNarrativeFactors(input)
  const positiveFactors = factors.filter((factor) => factor.direction === 'positive')
  const negativeFactors = factors.filter((factor) => factor.direction === 'negative')
  const averageScore = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null
  let stance: StockNarrativeStance = '資料不足'
  if (scores.length >= 2 || factors.length >= 3) {
    const balance = positiveFactors.length - negativeFactors.length
    stance = (averageScore ?? 50) >= 62 && balance > 0 ? '偏多' : (averageScore ?? 50) < 45 && balance < 0 ? '偏空' : balance >= 3 ? '偏多' : balance <= -3 ? '偏空' : '中性'
  }
  const riskFactors = buildStockNarrativeRisks(input, factors)
  const confidence = Math.min(100, Math.round((scores.length / 4) * 55 + (factors.length / 8) * 35 + (input.stale ? 0 : 10)))
  const headline = formatStockNarrativeHeadline(input.name, stance, positiveFactors, riskFactors)
  const summary = `${headline}${positiveFactors[0] ? ` 正向依據為${positiveFactors[0].explanation}` : ''}${riskFactors[0] ? ` 主要風險為${riskFactors[0].explanation}` : ''}`
  return { formulaVersion: 'stock-narrative-v1.0', stance, headline, summary, positiveFactors: positiveFactors.slice(0, 4), riskFactors: riskFactors.slice(0, 4), observation: formatStockObservation(stance, riskFactors), tradeDate: input.tradeDate, confidence, warnings: input.stale ? ['資料時效可能落後，敘事僅反映已取得資料。'] : [] }
}
