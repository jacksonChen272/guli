import type { TechnicalIndicatorSeries } from '../../types/technicalIndicator'
import type { TrendStructureResult } from '../../types/supportResistance'

const lastValue = (points: Array<{ value: number | null }>) => points.at(-1)?.value ?? null
const slope = (points: Array<{ value: number | null }>, period = 5) => {
  const current = points.at(-1)?.value ?? null
  const previous = points.at(-(period + 1))?.value ?? null
  return current === null || previous === null || previous === 0 ? null : Number(((current / previous - 1) * 100).toFixed(2))
}

export function classifyTrendStructure(series: TechnicalIndicatorSeries): TrendStructureResult {
  const close = series.prices.at(-1)?.close ?? null
  const ma5 = lastValue(series.ma5)
  const ma20 = lastValue(series.ma20)
  const ma60 = lastValue(series.ma60)
  const ma120 = lastValue(series.ma120)
  const ma20Slope = slope(series.ma20)
  const ma60Slope = slope(series.ma60)
  const recent20 = series.prices.slice(-20)
  const highs = recent20.map((item) => item.high).filter((value): value is number => value !== null)
  const lows = recent20.map((item) => item.low).filter((value): value is number => value !== null)
  const high20 = highs.length ? Math.max(...highs) : null
  const low20 = lows.length ? Math.min(...lows) : null
  const macdHistogram = series.macd.at(-1)?.histogram ?? null
  const values = { close, ma5, ma20, ma60, ma120, ma20Slope, ma60Slope, high20, low20, macdHistogram }
  if (series.sampleSize < 60 || [close, ma5, ma20, ma60].some((value) => value === null)) {
    return { classification: '資料不足', evidence: [`歷史資料僅 ${series.sampleSize} 筆，至少需要 60 個交易日判讀中期結構。`], values }
  }
  const evidence = [
    `收盤價${close! >= ma20! ? '位於' : '低於'} MA20`,
    `MA20 近 5 日斜率 ${ma20Slope?.toFixed(2) ?? '—'}%`,
    `MACD 柱狀值 ${macdHistogram?.toFixed(2) ?? '—'}`,
  ]
  if (ma120 !== null && close! > ma5! && ma5! > ma20! && ma20! > ma60! && ma60! > ma120 && (ma20Slope ?? 0) > 0 && (ma60Slope ?? 0) > 0) return { classification: '多頭排列', evidence, values }
  if (close! > ma20! && ma20! > ma60! && (ma20Slope ?? 0) > 0) return { classification: '偏多結構', evidence, values }
  if (ma120 !== null && close! < ma5! && ma5! < ma20! && ma20! < ma60! && ma60! < ma120 && (ma20Slope ?? 0) < 0 && (ma60Slope ?? 0) < 0) return { classification: '空頭排列', evidence, values }
  if (close! < ma20! && ma20! < ma60! && (ma20Slope ?? 0) < 0) return { classification: '偏空結構', evidence, values }
  return { classification: '盤整', evidence, values }
}
