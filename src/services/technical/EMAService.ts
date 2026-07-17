import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import { closes, round, toIndicatorPoints } from './indicatorUtils'

export function calculateEMA(prices: OfficialStockHistoryPrice[], period: number) {
  const source = closes(prices)
  const values: Array<number | null> = Array(source.length).fill(null)
  if (source.length >= period) {
    const seed = source.slice(0, period)
    if (seed.every((value): value is number => value !== null)) {
      values[period - 1] = round(seed.reduce((sum, value) => sum + value, 0) / period)
      const multiplier = 2 / (period + 1)
      for (let index = period; index < source.length; index += 1) {
        const close = source[index]
        const previous = values[index - 1]
        values[index] = close === null || previous === null ? null : round((close - previous) * multiplier + previous)
      }
    }
  }
  return toIndicatorPoints(prices, values, period)
}

