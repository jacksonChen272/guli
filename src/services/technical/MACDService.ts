import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import type { MacdPoint } from '../../types/technicalIndicator'
import { calculateEMA } from './EMAService'
import { round } from './indicatorUtils'

export function calculateMACD(prices: OfficialStockHistoryPrice[], fast = 12, slow = 26, signalPeriod = 9): MacdPoint[] {
  const fastValues = calculateEMA(prices, fast).map((point) => point.value)
  const slowValues = calculateEMA(prices, slow).map((point) => point.value)
  const macd = prices.map((_, index) => fastValues[index] === null || slowValues[index] === null ? null : round((fastValues[index] as number) - (slowValues[index] as number)))
  const signal: Array<number | null> = Array(prices.length).fill(null)
  const first = macd.findIndex((value) => value !== null)
  if (first >= 0) {
    const seed = macd.slice(first, first + signalPeriod)
    if (seed.length === signalPeriod && seed.every((value): value is number => value !== null)) {
      signal[first + signalPeriod - 1] = round(seed.reduce((sum, value) => sum + value, 0) / signalPeriod)
      const multiplier = 2 / (signalPeriod + 1)
      for (let index = first + signalPeriod; index < macd.length; index += 1) {
        const value = macd[index]
        const previous = signal[index - 1]
        signal[index] = value === null || previous === null ? null : round((value - previous) * multiplier + previous)
      }
    }
  }
  return prices.map((price, index) => ({
    tradeDate: price.tradeDate,
    macd: macd[index],
    signal: signal[index],
    histogram: macd[index] === null || signal[index] === null ? null : round((macd[index] as number) - (signal[index] as number)),
  }))
}

