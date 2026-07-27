import type { DecisionDirection } from '../../types/decision'
import type { MarketSentimentResult, TodaySummaryResult } from '../../types/dashboardIntelligence'
import type { IndustrySnapshot } from '../../types/industrySnapshot'
import type { OfficialMarketOverview } from '../../types/marketData'
import type { InstitutionalMarketTotals } from '../../types/officialInstitutionalData'

export interface TodaySummaryInput {
  sentiment: MarketSentimentResult
  market: OfficialMarketOverview | null
  institutions: InstitutionalMarketTotals | null
}

export interface DashboardSummaryItem {
  id: 'index' | 'breadth' | 'turnover' | 'institutional' | 'industry' | 'limits' | 'sentiment'
  text: string
  tone: 'positive' | 'neutral' | 'warning'
}

export interface DashboardSummaryInput extends TodaySummaryInput {
  industries: IndustrySnapshot | null
}

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
const formatAmountInBillions = (value: number) =>
  `${Math.abs(value / 100_000_000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 億元`

export function generateDashboardSummaryItems(input: DashboardSummaryInput): DashboardSummaryItem[] {
  const items: DashboardSummaryItem[] = []
  const { market } = input

  if (market && isFiniteNumber(market.changePercent) && isFiniteNumber(market.indexValue)) {
    const direction = market.changePercent > 0 ? '上漲' : market.changePercent < 0 ? '下跌' : '收平'
    items.push({
      id: 'index',
      text: `加權指數${direction} ${formatPercent(market.changePercent)}，收在 ${market.indexValue.toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 點。`,
      tone: market.changePercent > 0 ? 'positive' : market.changePercent < 0 ? 'warning' : 'neutral',
    })
  }

  if (market && isFiniteNumber(market.advanceCount) && isFiniteNumber(market.declineCount)) {
    const difference = market.advanceCount - market.declineCount
    items.push({
      id: 'breadth',
      text: difference > 0
        ? `上漲家數比下跌家數多 ${difference.toLocaleString('zh-TW')} 家，市場廣度偏強。`
        : difference < 0
          ? `下跌家數比上漲家數多 ${Math.abs(difference).toLocaleString('zh-TW')} 家，市場廣度偏弱。`
          : '上漲與下跌家數相同，市場廣度中性。',
      tone: difference > 0 ? 'positive' : difference < 0 ? 'warning' : 'neutral',
    })
  }

  if (market && market.tradingHistory.length >= 2) {
    const previous = market.tradingHistory.at(-2)?.tradingAmount
    if (isFiniteNumber(previous) && previous > 0 && isFiniteNumber(market.tradingAmount)) {
      const change = (market.tradingAmount / previous - 1) * 100
      items.push({
        id: 'turnover',
        text: `成交值較前一交易日${change >= 0 ? '增加' : '減少'} ${Math.abs(change).toFixed(1)}%。`,
        tone: Math.abs(change) < 5 ? 'neutral' : change * market.changePercent >= 0 ? 'positive' : 'warning',
      })
    }
  }

  const foreign = input.institutions?.foreign.netAmount
  if (isFiniteNumber(foreign)) {
    items.push({
      id: 'institutional',
      text: `外資及陸資今日${foreign > 0 ? '買超' : foreign < 0 ? '賣超' : '買賣超接近平衡'}${foreign === 0 ? '。' : ` ${formatAmountInBillions(foreign)}。`}`,
      tone: foreign > 0 ? 'positive' : foreign < 0 ? 'warning' : 'neutral',
    })
  }

  const industries = [...(input.industries?.industries ?? [])]
    .filter((item): item is typeof item & { return1d: number } => isFiniteNumber(item.return1d))
    .sort((left, right) => right.return1d - left.return1d)
  if (industries.length) {
    const strongest = industries[0]
    const weakest = industries.at(-1)
    const weakText = weakest && weakest.industryId !== strongest.industryId
      ? `；${weakest.industryName}相對偏弱`
      : ''
    items.push({
      id: 'industry',
      text: `${strongest.industryName}為今日相對強勢族群${weakText}。`,
      tone: 'neutral',
    })
  }

  if (market && (isFiniteNumber(market.limitUpCount) || isFiniteNumber(market.limitDownCount))) {
    items.push({
      id: 'limits',
      text: `收盤漲幅達 9.5% 以上 ${market.limitUpCount ?? 0} 家、跌幅達 -9.5% 以下 ${market.limitDownCount ?? 0} 家；此為門檻推導統計。`,
      tone: (market.limitDownCount ?? 0) > (market.limitUpCount ?? 0) ? 'warning' : 'neutral',
    })
  }

  if (input.sentiment.score !== null && isFiniteNumber(input.sentiment.score)) {
    items.push({
      id: 'sentiment',
      text: `市場情緒分數 ${input.sentiment.score.toFixed(1)}，判定為「${input.sentiment.label}」。`,
      tone: input.sentiment.score >= 60 ? 'positive' : input.sentiment.score < 40 ? 'warning' : 'neutral',
    })
  }

  return items.slice(0, 5)
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
