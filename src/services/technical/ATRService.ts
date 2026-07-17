import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import { rollingValues, round, toIndicatorPoints } from './indicatorUtils'

export function calculateATR(prices: OfficialStockHistoryPrice[], period = 14) {
  const ranges = prices.map((price, index) => {
    if (price.high === null || price.low === null) return null
    const previousClose = index ? prices[index - 1].close : null
    return previousClose === null
      ? round(price.high - price.low)
      : round(Math.max(price.high - price.low, Math.abs(price.high - previousClose), Math.abs(price.low - previousClose)))
  })
  return toIndicatorPoints(prices, rollingValues(ranges, period, (window) => window.reduce((sum, value) => sum + value, 0) / period), period)
}

