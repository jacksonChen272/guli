import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import type { BollingerPoint } from '../../types/technicalIndicator'
import { closes, round } from './indicatorUtils'

export function calculateBollinger(prices: OfficialStockHistoryPrice[], period = 20, deviations = 2): BollingerPoint[] {
  const source = closes(prices)
  return prices.map((price, index) => {
    if (index + 1 < period) return { tradeDate: price.tradeDate, upper: null, middle: null, lower: null }
    const window = source.slice(index + 1 - period, index + 1)
    if (window.some((value) => value === null)) return { tradeDate: price.tradeDate, upper: null, middle: null, lower: null }
    const numeric = window as number[]
    const middle = numeric.reduce((sum, value) => sum + value, 0) / period
    const deviation = Math.sqrt(numeric.reduce((sum, value) => sum + (value - middle) ** 2, 0) / period)
    return { tradeDate: price.tradeDate, upper: round(middle + deviations * deviation), middle: round(middle), lower: round(middle - deviations * deviation) }
  })
}

