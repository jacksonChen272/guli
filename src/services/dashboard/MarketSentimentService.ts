import type { DecisionResult } from '../../types/decision'
import type { MarketSentimentFactor, MarketSentimentLevel, MarketSentimentResult } from '../../types/dashboardIntelligence'
import type { OfficialMarketOverview } from '../../types/marketData'
import type { InstitutionalMarketTotals } from '../../types/officialInstitutionalData'

export interface MarketSentimentInput {
  market: OfficialMarketOverview | null
  institutions: InstitutionalMarketTotals | null
  decision: DecisionResult | null
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))
const rounded = (value: number) => Math.round(value * 10) / 10

export function classifyMarketSentiment(score: number | null): { level: MarketSentimentLevel; label: string } {
  if (score === null) return { level: 'neutral', label: '資料不足' }
  if (score < 20) return { level: 'extreme-fear', label: '極度恐慌' }
  if (score < 40) return { level: 'bearish', label: '偏空' }
  if (score < 60) return { level: 'neutral', label: '中性' }
  if (score < 80) return { level: 'bullish', label: '偏多' }
  return { level: 'optimistic', label: '樂觀' }
}

export function calculateMarketSentiment(input: MarketSentimentInput): MarketSentimentResult {
  const factors: MarketSentimentFactor[] = []
  const add = (factor: MarketSentimentFactor) => factors.push(factor)

  const decisionScore = input.decision?.score ?? null
  add({ id: 'market-decision', label: '市場判讀分數', score: decisionScore, weight: 30, contribution: decisionScore === null ? null : decisionScore * 0.3, explanation: decisionScore === null ? '尚未取得市場判讀分數。' : `市場判讀分數為 ${decisionScore.toFixed(1)}。`, sourceType: decisionScore === null ? 'missing' : 'derived' })

  const advance = input.market?.advanceCount ?? null
  const decline = input.market?.declineCount ?? null
  const breadthTotal = advance !== null && decline !== null ? advance + decline : 0
  const breadthScore = breadthTotal > 0 ? advance! / breadthTotal * 100 : null
  add({ id: 'breadth', label: '市場廣度', score: breadthScore === null ? null : rounded(breadthScore), weight: 25, contribution: breadthScore === null ? null : breadthScore * 0.25, explanation: breadthScore === null ? '尚未取得完整漲跌家數。' : `上漲 ${advance} 家、下跌 ${decline} 家。`, sourceType: breadthScore === null ? 'missing' : 'official' })

  const foreignNet = input.institutions?.foreign.netAmount ?? null
  const tradingAmount = input.market?.tradingAmount ?? null
  const foreignScore = foreignNet !== null && tradingAmount && tradingAmount > 0 ? clamp(50 + foreignNet / tradingAmount * 500) : null
  add({ id: 'foreign-flow', label: '外資買賣超', score: foreignScore === null ? null : rounded(foreignScore), weight: 20, contribution: foreignScore === null ? null : foreignScore * 0.2, explanation: foreignNet === null ? '尚未取得外資買賣超。' : `外資及陸資淨額 ${foreignNet >= 0 ? '買超' : '賣超'}。`, sourceType: foreignScore === null ? 'missing' : 'official' })

  const history = input.market?.tradingHistory ?? []
  const previous = history.slice(0, -1).slice(-20).map((point) => point.tradingAmount).filter((value) => value > 0)
  const average = previous.length ? previous.reduce((sum, value) => sum + value, 0) / previous.length : null
  const turnoverChange = tradingAmount !== null && average ? tradingAmount / average - 1 : null
  const marketDirection = (input.market?.changePercent ?? 0) >= 0 ? 1 : -1
  const turnoverScore = turnoverChange === null ? null : clamp(50 + turnoverChange * 100 * marketDirection)
  add({ id: 'turnover', label: '成交值動能', score: turnoverScore === null ? null : rounded(turnoverScore), weight: 15, contribution: turnoverScore === null ? null : turnoverScore * 0.15, explanation: turnoverChange === null ? '交易歷史不足，無法比較成交值。' : `成交值較近 ${previous.length} 日平均${turnoverChange >= 0 ? '增加' : '減少'} ${Math.abs(turnoverChange * 100).toFixed(1)}%。`, sourceType: turnoverScore === null ? 'missing' : 'official' })

  const direction = input.decision?.direction ?? 'unknown'
  const directionSign = direction === 'bullish' ? 1 : direction === 'bearish' ? -1 : 0
  const summaryScore = input.decision ? clamp(50 + directionSign * input.decision.confidence / 2) : null
  add({ id: 'decision-summary', label: '市場判讀方向', score: summaryScore === null ? null : rounded(summaryScore), weight: 10, contribution: summaryScore === null ? null : summaryScore * 0.1, explanation: input.decision ? `市場方向為 ${input.decision.label}，信心 ${input.decision.confidence}%。` : '尚未取得市場判讀摘要。', sourceType: summaryScore === null ? 'missing' : 'derived' })

  const available = factors.filter((factor) => factor.score !== null)
  const availableWeight = available.reduce((sum, factor) => sum + factor.weight, 0)
  const score = availableWeight ? rounded(available.reduce((sum, factor) => sum + factor.score! * factor.weight, 0) / availableWeight) : null
  const confidence = Math.round(availableWeight)
  const classification = classifyMarketSentiment(score)
  const warnings = factors.filter((factor) => factor.score === null).map((factor) => `${factor.label}資料不足。`)
  return { score, ...classification, confidence, formulaVersion: 'market-sentiment-v1', tradeDate: input.market?.tradeDate ?? input.decision?.tradeDate ?? null, factors, warnings }
}

