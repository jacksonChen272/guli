import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import { closes, rollingValues, toIndicatorPoints } from './indicatorUtils'

export function calculateSMA(prices: OfficialStockHistoryPrice[], period: number) {
  const values = rollingValues(closes(prices), period, (window) => window.reduce((sum, value) => sum + value, 0) / period)
  return toIndicatorPoints(prices, values, period)
}

