import { classifyMarketSentiment } from './MarketSentimentService'
import type { DecisionResult } from '../../types/decision'
import type { MarketSentimentResult } from '../../types/dashboardIntelligence'
import type { OfficialMarketOverview } from '../../types/marketData'

export interface MarketScoreViewModel {
  trend: {
    direction: DecisionResult['direction']
    label: string
    score: number | null
    confidence: number | null
    tradeDate: string | null
    description: string
  }
  sentiment: {
    score: number | null
    label: string
    level: MarketSentimentResult['level']
    interval: string
    confidence: number
    reason: string
    tradeDate: string | null
    formulaVersion: MarketSentimentResult['formulaVersion']
  }
  breadth: {
    label: '偏多' | '中性' | '偏空' | '資料不足'
    advanceRatio: number | null
    advance: number | null
    decline: number | null
    unchanged: number | null
    tradeDate: string | null
    description: string
  }
}

export function sentimentInterval(score: number | null) {
  if (score === null) return '資料不足'
  if (score < 20) return '0–未滿 20'
  if (score < 40) return '20–未滿 40'
  if (score < 60) return '40–未滿 60'
  if (score < 80) return '60–未滿 80'
  return '80–100'
}

export function buildMarketScoreViewModel({
  decision,
  sentiment,
  market,
}: {
  decision: DecisionResult | null
  sentiment: MarketSentimentResult
  market: OfficialMarketOverview | null
}): MarketScoreViewModel {
  const advance = market?.advanceCount ?? null
  const decline = market?.declineCount ?? null
  const unchanged = market?.unchangedCount ?? null
  const total = (advance ?? 0) + (decline ?? 0) + (unchanged ?? 0)
  const advanceRatio = total > 0 && advance !== null ? advance / total * 100 : null
  const breadthLabel = advanceRatio === null
    ? '資料不足'
    : advanceRatio >= 55
      ? '偏多'
      : advanceRatio <= 40
        ? '偏空'
        : '中性'
  const classification = classifyMarketSentiment(sentiment.score)
  const primaryFactor = sentiment.factors
    .filter((factor) => factor.score !== null)
    .sort((left, right) => right.weight - left.weight)[0]

  return {
    trend: {
      direction: decision?.direction ?? 'unknown',
      label: decision?.label ?? '資料不足',
      score: decision?.score ?? null,
      confidence: decision?.confidence ?? null,
      tradeDate: decision?.tradeDate ?? null,
      description: decision
        ? '趨勢方向來自既有 Decision 結果，不等同市場情緒分數。'
        : '尚未取得市場 Decision 結果。',
    },
    sentiment: {
      score: sentiment.score,
      label: classification.label,
      level: classification.level,
      interval: sentimentInterval(sentiment.score),
      confidence: sentiment.confidence,
      reason: primaryFactor?.explanation ?? '可用因子不足，暫不推論市場情緒。',
      tradeDate: sentiment.tradeDate,
      formulaVersion: sentiment.formulaVersion,
    },
    breadth: {
      label: breadthLabel,
      advanceRatio,
      advance,
      decline,
      unchanged,
      tradeDate: market?.tradeDate ?? null,
      description: advanceRatio === null
        ? '上漲、下跌與平盤家數不足。'
        : `上漲家數占可統計家數 ${advanceRatio.toFixed(1)}%。`,
    },
  }
}
