import type { StockNarrativeFactor, StockNarrativeStance } from '../../types/stockNarrative'

export function formatStockNarrativeHeadline(name: string, stance: StockNarrativeStance, positive: StockNarrativeFactor[], risks: StockNarrativeFactor[]) {
  if (stance === '資料不足') return `${name}目前資料不足，先確認行情與歷史資料完整度。`
  const lead = stance === '偏多' ? '結構偏正向' : stance === '偏空' ? '結構承壓' : '多空訊號交錯'
  const reason = positive[0]?.label ?? risks[0]?.label ?? '價格與量能'
  return `${name}${lead}，主要觀察 ${reason}。`
}

export function formatStockObservation(stance: StockNarrativeStance, risks: StockNarrativeFactor[]) {
  if (stance === '資料不足') return '等待資料補齊後，再比較趨勢、動能與風險因子。'
  if (risks.length) return `持續觀察${risks.slice(0, 2).map((item) => item.label).join('、')}是否改善，並以最新交易日資料重新檢視。`
  return '持續觀察量價與法人方向是否延續，避免只依單一指標判讀。'
}
