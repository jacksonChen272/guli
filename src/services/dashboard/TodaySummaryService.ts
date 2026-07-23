import type { DecisionDirection } from '../../types/decision'
import type { MarketSentimentResult, TodaySummaryResult } from '../../types/dashboardIntelligence'
import type { OfficialMarketOverview } from '../../types/marketData'
import type { InstitutionalMarketTotals } from '../../types/officialInstitutionalData'

export interface TodaySummaryInput {
  sentiment: MarketSentimentResult
  market: OfficialMarketOverview | null
  institutions: InstitutionalMarketTotals | null
}

export function generateTodaySummary(input: TodaySummaryInput): TodaySummaryResult {
  const { sentiment, market, institutions } = input
  const reasons: string[] = []
  const tags = [sentiment.label]
  const foreign = institutions?.foreign.netAmount ?? null
  const history = market?.tradingHistory ?? []
  const closes = history.slice(-20).map((point) => point.indexValue).filter((value) => value > 0)
  const ma20 = closes.length >= 5 ? closes.reduce((sum, value) => sum + value, 0) / closes.length : null
  const distance = market && ma20 ? (market.indexValue / ma20 - 1) * 100 : null

  let stance: DecisionDirection = 'neutral'
  if (sentiment.score !== null && sentiment.score >= 60) stance = 'bullish'
  else if (sentiment.score !== null && sentiment.score < 40) stance = 'bearish'
  else if (sentiment.score === null) stance = 'unknown'

  const parts = [`今日市場${sentiment.label}`]
  if (foreign !== null) {
    const flow = foreign > 0 ? '外資買超' : foreign < 0 ? '外資賣超' : '外資買賣接近平衡'
    parts.push(flow)
    reasons.push(flow)
    tags.push(foreign > 0 ? '外資買超' : foreign < 0 ? '外資賣超' : '法人中性')
  } else reasons.push('法人資料尚未取得')

  if (distance !== null) {
    const position = Math.abs(distance) <= 1 ? '加權指數接近月線' : distance > 0 ? '加權指數位於月線之上' : '加權指數位於月線之下'
    parts.push(position)
    reasons.push(`${position}（${distance > 0 ? '+' : ''}${distance.toFixed(2)}%）`)
    tags.push(Math.abs(distance) <= 1 ? '月線附近' : distance > 0 ? '月線之上' : '月線之下')
  } else reasons.push('月線樣本不足')

  const breadth = market?.advanceCount !== null && market?.advanceCount !== undefined && market.declineCount !== null
    ? market.advanceCount - market.declineCount : null
  if (breadth !== null) reasons.push(`漲跌家數差 ${breadth > 0 ? '+' : ''}${breadth} 家`)

  const observation = stance === 'bullish' ? '短線可留意趨勢延續與量價同步。' : stance === 'bearish' ? '短線宜優先控制風險與部位。' : stance === 'unknown' ? '資料尚未齊全，暫不判定市場方向。' : '多空訊號交錯，宜等待方向確認。'
  const text = `${parts.join('，')}，${observation}`
  return { text, stance, tags: [...new Set(tags)].slice(0, 3), reasons, formulaVersion: 'today-summary-v1.0', tradeDate: market?.tradeDate ?? sentiment.tradeDate }
}

