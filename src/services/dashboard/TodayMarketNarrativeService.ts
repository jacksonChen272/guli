import type { DecisionResult } from '../../types/decision'
import type { IndustrySnapshot } from '../../types/industrySnapshot'
import type { OfficialMarketOverview } from '../../types/marketData'
import type { InstitutionalMarketTotals } from '../../types/officialInstitutionalData'
import type { ScreenerDataset } from '../../types/screener'

export type TodayMarketStance = 'bullish' | 'neutral' | 'bearish' | 'insufficient'

export interface TodayMarketNarrative {
  title: string
  summary: string
  stance: TodayMarketStance
  confidence: number
  positiveFactors: string[]
  negativeFactors: string[]
  riskNotes: string[]
  sourceSummary: string[]
  tradeDate: string | null
  formulaVersion: 'today-narrative-v1.0'
}

export interface TodayMarketNarrativeInput {
  market: OfficialMarketOverview | null
  decision: DecisionResult | null
  institutions: InstitutionalMarketTotals | null
  industries: IndustrySnapshot | null
  screener: ScreenerDataset | null
}

export function generateTodayMarketNarrative(input: TodayMarketNarrativeInput): TodayMarketNarrative {
  const positiveFactors: string[] = []
  const negativeFactors: string[] = []
  const riskNotes: string[] = []
  const sourceSummary: string[] = []
  const dates = new Set<string>()
  let score = 50
  let available = 0
  let possible = 0

  possible += 3
  if (input.market) {
    available += 3
    dates.add(input.market.tradeDate)
    sourceSummary.push('TWSE 官方市場盤後資料')
    if (input.market.changePercent >= 0.3) { score += 10; positiveFactors.push(`加權指數上漲 ${formatPercent(input.market.changePercent)}`) }
    else if (input.market.changePercent <= -0.3) { score -= 10; negativeFactors.push(`加權指數下跌 ${formatPercent(input.market.changePercent)}`) }
    else riskNotes.push('加權指數接近平盤，方向仍待確認')

    const breadthTotal = (input.market.advanceCount ?? 0) + (input.market.declineCount ?? 0) + (input.market.unchangedCount ?? 0)
    if (input.market.advanceCount !== null && input.market.declineCount !== null && breadthTotal > 0) {
      const breadth = (input.market.advanceCount - input.market.declineCount) / breadthTotal
      if (breadth >= 0.1) { score += 10; positiveFactors.push(`上漲家數多於下跌家數 ${input.market.advanceCount - input.market.declineCount} 家`) }
      else if (breadth <= -0.1) { score -= 10; negativeFactors.push(`下跌家數多於上漲家數 ${input.market.declineCount - input.market.advanceCount} 家`) }
      else riskNotes.push('市場漲跌家數接近，廣度呈中性')
    } else {
      available -= 1
      riskNotes.push('市場廣度資料不足')
    }

    const history = input.market.tradingHistory
    if (history.length >= 2) {
      const previous = history.at(-2)?.tradingAmount ?? 0
      const change = previous > 0 ? (input.market.tradingAmount / previous - 1) * 100 : null
      if (change !== null && change >= 10) { score += 4; positiveFactors.push(`成交值較前一交易日增加 ${change.toFixed(1)}%`) }
      else if (change !== null && change <= -10) { score -= 4; negativeFactors.push(`成交值較前一交易日減少 ${Math.abs(change).toFixed(1)}%`) }
    }
  }

  possible += 2
  if (input.institutions) {
    available += 2
    sourceSummary.push('TWSE 官方三大法人盤後資料')
    applyFlow('外資及陸資', input.institutions.foreign.netAmount, 8, positiveFactors, negativeFactors, (points) => { score += points })
    applyFlow('三大法人合計', input.institutions.total.netAmount, 6, positiveFactors, negativeFactors, (points) => { score += points })
  } else riskNotes.push('法人資料尚未取得，不推測買賣超方向')

  possible += 1
  if (input.decision?.score !== null && input.decision) {
    available += 1
    dates.add(input.decision.tradeDate)
    sourceSummary.push('GULI 固定規則市場判讀')
    if (input.decision.direction === 'bullish') { score += 10; positiveFactors.push('市場判讀因子偏正向') }
    else if (input.decision.direction === 'bearish') { score -= 10; negativeFactors.push('市場判讀因子偏負向') }
  }

  possible += 1
  const sortedIndustries = [...(input.industries?.industries ?? [])].filter((item) => item.return1d !== null).sort((left, right) => (right.return1d ?? 0) - (left.return1d ?? 0))
  if (sortedIndustries.length) {
    available += 1
    dates.add(input.industries!.tradeDate)
    sourceSummary.push('產業分類與強度為規則推導')
    const strongest = sortedIndustries[0]
    const weakest = sortedIndustries.at(-1)!
    if ((strongest.return1d ?? 0) > 0) positiveFactors.push(`${strongest.industryName}為今日相對強勢族群`)
    if ((weakest.return1d ?? 0) < 0) negativeFactors.push(`${weakest.industryName}表現相對偏弱`)
  }

  possible += 1
  if (input.screener) {
    available += 1
    if (input.screener.tradeDate) dates.add(input.screener.tradeDate)
    sourceSummary.push('技術條件由固定規則計算')
    const highRiskRate = input.screener.sampleCount ? input.screener.highRiskCount / input.screener.sampleCount : 0
    if (highRiskRate >= 0.4) { score -= 6; riskNotes.push(`高風險條件占目前技術樣本 ${Math.round(highRiskRate * 100)}%`) }
    const strong = input.screener.presets.find((item) => item.presetId === 'strong-trend')?.matchedCount ?? 0
    if (strong > 0) positiveFactors.push(`${strong} 檔實際樣本符合強勢趨勢條件`)
  }

  const confidenceBase = possible ? available / possible * 100 : 0
  const datePenalty = dates.size > 2 ? 12 : dates.size > 1 ? 5 : 0
  if (datePenalty) riskNotes.push('部分資料來源交易日期不同，判讀信心已調降')
  const confidence = Math.max(0, Math.min(100, Math.round(confidenceBase - datePenalty)))
  const stance: TodayMarketStance = confidence < 45 ? 'insufficient' : score >= 60 ? 'bullish' : score <= 40 ? 'bearish' : 'neutral'
  const strongest = sortedIndustries[0]?.industryName
  const weakest = sortedIndustries.at(-1)?.industryName
  return {
    title: titleFor(stance),
    summary: summaryFor(stance, input.market, input.institutions, strongest, weakest, riskNotes),
    stance,
    confidence,
    positiveFactors: unique(positiveFactors).slice(0, 5),
    negativeFactors: unique(negativeFactors).slice(0, 5),
    riskNotes: unique(riskNotes).slice(0, 5),
    sourceSummary: unique(sourceSummary),
    tradeDate: [...dates].sort().at(-1) ?? input.market?.tradeDate ?? null,
    formulaVersion: 'today-narrative-v1.0',
  }
}

export function getOperationEnvironment(stance: TodayMarketStance) {
  if (stance === 'bullish') return ['趨勢股可優先觀察', '留意量價同步標的', '避免追逐過熱股票']
  if (stance === 'bearish') return ['優先控制風險', '留意跌破均線股票', '避免高波動追價']
  if (stance === 'insufficient') return ['等待資料補齊', '先確認個股資料日期', '避免只依單一指標判斷']
  return ['以個股與族群輪動為主', '等待量價確認', '控制部位與追價風險']
}

function applyFlow(label: string, value: number | null, weight: number, positive: string[], negative: string[], update: (points: number) => void) {
  if (value === null || value === 0) return
  if (value > 0) { update(weight); positive.push(`${label}呈買超`) }
  else { update(-weight); negative.push(`${label}呈賣超`) }
}

function titleFor(stance: TodayMarketStance) {
  if (stance === 'bullish') return '市場條件偏多，留意強勢族群延續性'
  if (stance === 'bearish') return '市場條件偏空，短線優先管理風險'
  if (stance === 'insufficient') return '資料尚未齊全，暫不判定市場方向'
  return '市場多空交錯，以個股與族群輪動為主'
}

function summaryFor(stance: TodayMarketStance, market: OfficialMarketOverview | null, institutions: InstitutionalMarketTotals | null, strongest?: string, weakest?: string, risks: string[] = []) {
  const parts: string[] = []
  if (market) parts.push(`加權指數${market.changePercent > 0 ? '收高' : market.changePercent < 0 ? '收低' : '收平'}，市場廣度${(market.advanceCount ?? 0) > (market.declineCount ?? 0) ? '偏強' : (market.advanceCount ?? 0) < (market.declineCount ?? 0) ? '偏弱' : '中性'}`)
  if (strongest) parts.push(`資金關注 ${strongest}`)
  if (weakest && weakest !== strongest) parts.push(`${weakest}相對承壓`)
  if (institutions?.foreign.netAmount !== null && institutions) parts.push(`外資${institutions.foreign.netAmount! >= 0 ? '買超' : '賣超'}仍是重要觀察因子`)
  if (!parts.length) return stance === 'insufficient' ? '目前缺少足夠的市場、法人或技術資料，不會以空值推測今日行情。' : '今日市場訊號交錯，建議搭配個股與族群資料交叉確認。'
  return `${parts.join('；')}。${risks[0] ? `需留意${risks[0]}。` : ''}`
}

const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
const unique = (values: string[]) => [...new Set(values)]
