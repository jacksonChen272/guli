import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import type { StochasticPoint } from '../../types/technicalIndicator'
import { round } from './indicatorUtils'

export function calculateStochastic(prices: OfficialStockHistoryPrice[], lookback = 9): StochasticPoint[] {
  let previousK = 50
  let previousD = 50
  return prices.map((price, index) => {
    if (index + 1 < lookback) return { tradeDate: price.tradeDate, k: null, d: null }
    const window = prices.slice(index + 1 - lookback, index + 1)
    const highs = window.map((point) => point.high)
    const lows = window.map((point) => point.low)
    if (price.close === null || highs.some((value) => value === null) || lows.some((value) => value === null)) return { tradeDate: price.tradeDate, k: null, d: null }
    const highest = Math.max(...highs as number[])
    const lowest = Math.min(...lows as number[])
    const rsv = highest === lowest ? 50 : (price.close - lowest) / (highest - lowest) * 100
    previousK = 2 / 3 * previousK + 1 / 3 * rsv
    previousD = 2 / 3 * previousD + 1 / 3 * previousK
    return { tradeDate: price.tradeDate, k: round(previousK), d: round(previousD) }
  })
}

