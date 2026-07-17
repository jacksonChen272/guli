import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import { closes, round, toIndicatorPoints } from './indicatorUtils'

export function calculateRSI(prices: OfficialStockHistoryPrice[], period = 14) {
  const source = closes(prices)
  const values: Array<number | null> = Array(source.length).fill(null)
  if (source.length > period && source.slice(0, period + 1).every((value) => value !== null)) {
    let gains = 0
    let losses = 0
    for (let index = 1; index <= period; index += 1) {
      const change = (source[index] as number) - (source[index - 1] as number)
      gains += Math.max(change, 0)
      losses += Math.max(-change, 0)
    }
    let averageGain = gains / period
    let averageLoss = losses / period
    values[period] = averageLoss === 0 ? 100 : round(100 - 100 / (1 + averageGain / averageLoss))
    for (let index = period + 1; index < source.length; index += 1) {
      const current = source[index]
      const previous = source[index - 1]
      if (current === null || previous === null) continue
      const change = current - previous
      averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period
      averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period
      values[index] = averageLoss === 0 ? 100 : round(100 - 100 / (1 + averageGain / averageLoss))
    }
  }
  return toIndicatorPoints(prices, values, period)
}

