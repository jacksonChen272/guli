import type { HealthFactor, HealthFactorKey, RiskLevel, StockHealthResult, StockRiskAlert, SupportResistanceLevel } from '../types/insight'
import type { Stock } from '../types/stock'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
const returnFor = (stock: Stock, days: number) => {
  const history = stock.priceHistory.slice(-(days + 1))
  return history.length > 1 ? (history[history.length - 1].value / history[0].value - 1) * 100 : 0
}
const movingAverage = (stock: Stock, days: number) => average(stock.priceHistory.slice(-days).map((point) => point.value))
const institutionSum = (stock: Stock, days: number, key: 'foreign' | 'trust' | 'dealer' | 'total' = 'total') => stock.institutionalHistory.slice(-days).reduce((sum, point) => sum + point[key], 0)

const factorMeta: Record<HealthFactorKey, { label: string; weight: number }> = {
  trend: { label: '趨勢', weight: 0.2 }, momentum: { label: '動能', weight: 0.15 },
  institutional: { label: '法人', weight: 0.2 }, volumePrice: { label: '量價', weight: 0.15 },
  chips: { label: '籌碼', weight: 0.15 }, riskControl: { label: '風險控制', weight: 0.15 },
}

function computeRawFactors(stock: Stock): Record<HealthFactorKey, { score: number; explanation: string }> {
  const return5 = returnFor(stock, 5)
  const return20 = returnFor(stock, 20)
  const ma5 = movingAverage(stock, 5)
  const ma20 = movingAverage(stock, 20)
  const avgVolume20 = average(stock.priceHistory.slice(-20).map((point) => point.volume ?? 0))
  const volumeRatio = avgVolume20 ? stock.volume / avgVolume20 : 1
  const foreign5 = institutionSum(stock, 5, 'foreign')
  const trust5 = institutionSum(stock, 5, 'trust')
  const total20 = institutionSum(stock, 20)
  const trend = clamp(50 + return5 * 3 + return20 * 1.5 + (stock.price > ma5 ? 10 : -10) + (ma5 > ma20 ? 10 : -10))
  const momentum = clamp(50 + (stock.rsi - 50) * 0.7 + return5 * 3 + stock.momentum * 2)
  const institutional = clamp(50 + foreign5 / 65 + trust5 / 45 + total20 / 260)
  const volumePrice = clamp(48 + (volumeRatio - 1) * 30 + Math.sign(return5) * Math.min(Math.abs(return5) * 4, 18))
  const chips = clamp(55 + total20 / 320 - Math.max(stock.marginChange, 0) * 5 + stock.industryStrength * 0.18)
  const riskControl = clamp(88 - stock.volatility * 14 - Math.max(stock.rsi - 72, 0) * 1.5 - Math.max(-return20, 0) * 2)
  return {
    trend: { score: trend, explanation: `近 5 日 ${return5.toFixed(1)}%，股價${stock.price >= ma20 ? '站上' : '跌破'} 20 日均線。` },
    momentum: { score: momentum, explanation: `RSI ${stock.rsi.toFixed(0)}，短線動能為 ${stock.momentum.toFixed(1)}。` },
    institutional: { score: institutional, explanation: `外資近 5 日 ${foreign5 >= 0 ? '買超' : '賣超'} ${Math.abs(foreign5).toFixed(0)} 張。` },
    volumePrice: { score: volumePrice, explanation: `今日量為 20 日均量的 ${volumeRatio.toFixed(2)} 倍，量價${return5 >= 0 ? '偏正向' : '仍待改善'}。` },
    chips: { score: chips, explanation: `三大法人 20 日累計 ${total20 >= 0 ? '買超' : '賣超'} ${Math.abs(total20).toFixed(0)} 張，融資變化 ${stock.marginChange.toFixed(1)}%。` },
    riskControl: { score: riskControl, explanation: `20 日波動率 ${stock.volatility.toFixed(2)}%，${stock.rsi > 72 ? '短線偏熱' : '波動仍在可控範圍'}。` },
  }
}

export function calculateSupportResistance(stock: Stock): SupportResistanceLevel[] {
  const recent = stock.priceHistory.slice(-20).map((point) => point.value)
  const current = stock.price
  const tolerance = Math.max(current * 0.012, current * stock.volatility / 100)
  const below = recent.filter((value) => value < current).sort((a, b) => b - a)
  const above = recent.filter((value) => value > current).sort((a, b) => a - b)
  const fallbackStep = Math.max(current * 0.025, tolerance)
  const candidates = [
    { type: '支撐' as const, order: 1 as const, price: below[0] ?? current - fallbackStep },
    { type: '支撐' as const, order: 2 as const, price: below.find((value) => value < (below[0] ?? current) - tolerance) ?? current - fallbackStep * 2 },
    { type: '壓力' as const, order: 1 as const, price: above[0] ?? current + fallbackStep },
    { type: '壓力' as const, order: 2 as const, price: above.find((value) => value > (above[0] ?? current) + tolerance) ?? current + fallbackStep * 2 },
  ]
  return candidates.map((level) => {
    const touches = recent.filter((value) => Math.abs(value - level.price) <= tolerance).length
    const distancePercent = (level.price / current - 1) * 100
    return { ...level, price: Number(level.price.toFixed(current < 100 ? 2 : 1)), distancePercent: Number(distancePercent.toFixed(2)), strength: touches >= 3 ? '強' : touches === 2 ? '中' : '弱', isNear: Math.abs(distancePercent) <= 2 }
  })
}

export function calculateRiskLevel(scoreOrAlerts: number | StockRiskAlert[]): RiskLevel {
  if (typeof scoreOrAlerts === 'number') return scoreOrAlerts >= 72 ? '低' : scoreOrAlerts >= 48 ? '中' : '高'
  return scoreOrAlerts.some((alert) => alert.severity === '高') ? '高' : scoreOrAlerts.some((alert) => alert.severity === '中') ? '中' : '低'
}

function buildRisks(stock: Stock, levels: SupportResistanceLevel[]): StockRiskAlert[] {
  const risks: StockRiskAlert[] = []
  const return5 = returnFor(stock, 5)
  const volumeAverage = average(stock.priceHistory.slice(-20).map((point) => point.volume ?? 0))
  const foreign5 = institutionSum(stock, 5, 'foreign')
  const previousForeign5 = stock.institutionalHistory.slice(-10, -5).reduce((sum, point) => sum + point.foreign, 0)
  const add = (alert: StockRiskAlert) => risks.push(alert)
  if (return5 > 8 || stock.rsi > 75) add({ id: 'overbought', label: '漲幅過大', severity: return5 > 12 ? '高' : '中', reason: `近 5 日漲幅 ${return5.toFixed(1)}%，RSI ${stock.rsi.toFixed(0)}。`, condition: '5 日漲幅大於 8% 或 RSI 高於 75', advice: '避免追價，等待量價整理或拉回確認。' })
  if (stock.volume < volumeAverage * 0.72 && return5 > 0) add({ id: 'volume-slow', label: '成交量失速', severity: '中', reason: '上漲過程中成交量低於 20 日均量 72%。', condition: '價漲且量能明顯低於均量', advice: '留意買盤續航力與價量背離。' })
  if (foreign5 < 0 && previousForeign5 >= 0) add({ id: 'institution-sell', label: '法人轉賣', severity: Math.abs(foreign5) > 1200 ? '高' : '中', reason: `外資由前期買超轉為近 5 日賣超 ${Math.abs(foreign5).toFixed(0)} 張。`, condition: '前 5 日外資買超、近 5 日轉賣超', advice: '觀察法人賣壓是否連續擴大。' })
  if (stock.volatility > 2.2) add({ id: 'volatility', label: '高波動', severity: stock.volatility > 3.2 ? '高' : '中', reason: `20 日波動率達 ${stock.volatility.toFixed(2)}%。`, condition: '20 日日報酬標準差高於 2.2%', advice: '降低部位集中度並預留停損空間。' })
  if (levels.some((level) => level.type === '壓力' && level.order === 1 && level.isNear)) add({ id: 'near-resistance', label: '接近壓力', severity: '中', reason: '現價距第一壓力小於 2%。', condition: '壓力距離絕對值小於 2%', advice: '留意突破時是否有成交量配合。' })
  const firstSupport = levels.find((level) => level.type === '支撐' && level.order === 1)
  if (firstSupport && stock.price < firstSupport.price) add({ id: 'support-break', label: '跌破支撐', severity: '高', reason: '收盤價已跌破近期第一支撐。', condition: '現價低於第一支撐', advice: '重新檢視風險承受與停損紀律。' })
  if (stock.industryStrength < 45) add({ id: 'weak-industry', label: '產業轉弱', severity: '中', reason: `產業相對強度僅 ${stock.industryStrength.toFixed(0)}。`, condition: '產業相對強度低於 45', advice: '同時比較產業領先股是否同步轉弱。' })
  if (stock.marginChange > 3 && stock.institutions.total < 0) add({ id: 'unstable-chips', label: '籌碼不穩', severity: '高', reason: '融資增加同時法人賣超。', condition: '融資增幅大於 3% 且法人賣超', advice: '留意散戶籌碼增加造成的波動。' })
  return risks
}

export function generateStockSummary(stock: Stock, factors: HealthFactor[], risks: StockRiskAlert[]): string {
  const best = [...factors].sort((a, b) => b.score - a.score)[0]
  const weakest = [...factors].sort((a, b) => a.score - b.score)[0]
  const riskText = risks[0]?.label ?? `${weakest.label}仍有改善空間`
  const action = stock.rsi > 72 ? '短線漲幅偏大，不宜追價' : factors.find((factor) => factor.key === 'trend')!.score >= 66 ? '可持續觀察趨勢與量能是否延續' : '宜等待趨勢轉強後再評估'
  return `${best.label}表現是目前主要優勢；主要風險為${riskText}，${action}。`
}

export function calculateStockHealth(stock: Stock, universe: Stock[] = [stock]): StockHealthResult {
  const raw = computeRawFactors(stock)
  const peers = universe.filter((item) => item.industry === stock.industry && item.symbol !== stock.symbol)
  const peerRaw = peers.map(computeRawFactors)
  const factors = (Object.keys(factorMeta) as HealthFactorKey[]).map((key) => ({
    key, label: factorMeta[key].label, weight: factorMeta[key].weight, score: raw[key].score,
    industryAverage: peerRaw.length ? Math.round(average(peerRaw.map((item) => item[key].score))) : 60,
    explanation: raw[key].explanation,
  }))
  const totalScore = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0))
  const grade = totalScore >= 81 ? '強勢' : totalScore >= 66 ? '偏多' : totalScore >= 51 ? '中性' : totalScore >= 36 ? '偏弱' : '弱勢'
  const supportResistance = calculateSupportResistance(stock)
  const risks = buildRisks(stock, supportResistance)
  return { totalScore, grade, factors, supportResistance, risks, summary: generateStockSummary(stock, factors, risks) }
}
