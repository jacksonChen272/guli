import type { ScreenerEvaluationContext } from '../../types/screener'

const number = (value: number | null, digits = 1) => value === null ? '資料不足' : value.toFixed(digits)

export function explainTechnicalContext(context: ScreenerEvaluationContext) {
  const item = context.technical
  const reasons: string[] = []
  const risks: string[] = []
  if (item.close !== null && item.ma20 !== null) reasons.push(`收盤價${item.close >= item.ma20 ? '高於' : '低於'} MA20 ${Math.abs((item.close / item.ma20 - 1) * 100).toFixed(1)}%`)
  if (item.ma20Slope !== null) reasons.push(`MA20 近 5 日${item.ma20Slope > 0 ? '持續上升' : '未呈上升'}，斜率 ${item.ma20Slope.toFixed(2)}%`)
  if (item.volumeRatio !== null) reasons.push(`成交量為 20 日均量 ${item.volumeRatio.toFixed(1)} 倍`)
  if (item.rsi14 !== null) reasons.push(`RSI ${item.rsi14.toFixed(0)}，${item.rsi14 >= 70 ? '位於過熱區' : item.rsi14 >= 55 ? '偏強但未過熱' : item.rsi14 <= 35 ? '位於低檔' : '處於中性區'}`)
  if (item.macdHistogram !== null) reasons.push(`MACD 柱狀體 ${item.macdHistogram >= 0 ? '為正' : '為負'}（${number(item.macdHistogram, 3)}）`)
  if (context.dateAlignment.status !== 'aligned') risks.push(`資料日期狀態為 ${context.dateAlignment.status}：${context.dateAlignment.reasons[0]}`)
  if (item.volatility20 !== null && context.sampleVolatilityMedian !== null && item.volatility20 > context.sampleVolatilityMedian) risks.push('波動率高於可分析樣本中位數')
  if (item.close !== null && item.bollingerUpper !== null && item.close >= item.bollingerUpper * 0.98) risks.push('價格接近布林上軌')
  if (item.riskLevel === 'high') risks.push('固定技術風險規則判定為高風險')
  return { reasons, risks }
}
