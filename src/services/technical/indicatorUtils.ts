import type { IndicatorPoint } from '../../types/technicalIndicator'
import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'

export const round = (value: number, digits = 4) => Number(value.toFixed(digits))

export const toIndicatorPoints = (
  prices: OfficialStockHistoryPrice[],
  values: Array<number | null>,
  period: number,
): IndicatorPoint[] => prices.map((price, index) => ({
  tradeDate: price.tradeDate,
  value: values[index] ?? null,
  period,
  source: 'GULI Derived',
}))

export const closes = (prices: OfficialStockHistoryPrice[]) => prices.map((point) => point.close)
export const volumes = (prices: OfficialStockHistoryPrice[]) => prices.map((point) => point.volume)

export function rollingValues(values: Array<number | null>, period: number, calculate: (window: number[]) => number): Array<number | null> {
  return values.map((_, index) => {
    if (index + 1 < period) return null
    const window = values.slice(index + 1 - period, index + 1)
    if (window.some((value) => value === null)) return null
    return round(calculate(window as number[]))
  })
}

