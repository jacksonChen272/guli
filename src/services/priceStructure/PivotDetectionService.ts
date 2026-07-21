import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import type { PricePivot } from '../../types/supportResistance'

export function detectPricePivots(prices: OfficialStockHistoryPrice[], window = 2): PricePivot[] {
  if (window < 1 || prices.length < window * 2 + 1) return []
  const pivots: PricePivot[] = []
  for (let index = window; index < prices.length - window; index += 1) {
    const point = prices[index]
    const neighbors = prices.slice(index - window, index + window + 1)
    if (point.high !== null && neighbors.every((item, offset) => offset === window || item.high === null || point.high! >= item.high)) {
      pivots.push({ tradeDate: point.tradeDate, price: point.high, type: 'high', window })
    }
    if (point.low !== null && neighbors.every((item, offset) => offset === window || item.low === null || point.low! <= item.low)) {
      pivots.push({ tradeDate: point.tradeDate, price: point.low, type: 'low', window })
    }
  }
  return pivots
}
