import type { TechnicalIndicatorSeries } from '../../types/technicalIndicator'
import type { SupportResistanceAnalysis } from '../../types/supportResistance'
import { detectPricePivots } from './PivotDetectionService'
import { buildPriceZones, pivotsToCandidates, type PriceLevelCandidate } from './PriceZoneService'
import { classifyTrendStructure } from './TrendStructureService'

const lastValue = (points: Array<{ value: number | null }>) => points.at(-1)?.value ?? null
const extremes = (series: TechnicalIndicatorSeries, days: number) => {
  const prices = series.prices.slice(-days)
  const lows = prices.map((item) => item.low).filter((value): value is number => value !== null)
  const highs = prices.map((item) => item.high).filter((value): value is number => value !== null)
  return { low: lows.length ? Math.min(...lows) : null, high: highs.length ? Math.max(...highs) : null }
}

export function calculateSupportResistanceFromHistory(series: TechnicalIndicatorSeries): SupportResistanceAnalysis {
  const currentPrice = series.prices.at(-1)?.close ?? null
  const atr14 = lastValue(series.atr14)
  const pivots = detectPricePivots(series.prices.slice(-120), 2)
  const trend = classifyTrendStructure(series)
  const warnings: string[] = []
  if (series.sampleSize < 20 || currentPrice === null) {
    return { formulaVersion: 'support-resistance-v1.0', tradeDate: series.lastTradeDate, currentPrice, atr14, zones: [], supports: [], resistances: [], pivots, trend, sampleSize: series.sampleSize, warnings: ['歷史資料不足 20 個交易日，不建立支撐壓力價位。'] }
  }
  const candidates: PriceLevelCandidate[] = pivotsToCandidates(pivots)
  const add = (price: number | null, source: string) => { if (price !== null) candidates.push({ price, type: price <= currentPrice ? 'support' : 'resistance', source }) }
  const range20 = extremes(series, 20)
  add(range20.low, '20 日區間低點'); add(range20.high, '20 日區間高點')
  if (series.sampleSize >= 60) {
    const range60 = extremes(series, 60)
    add(range60.low, '60 日區間低點'); add(range60.high, '60 日區間高點')
  } else warnings.push('不足 60 個交易日，未建立 60 日區間價位。')
  add(lastValue(series.ma20), 'MA20')
  add(lastValue(series.ma60), 'MA60')
  const bollinger = series.bollinger.at(-1)
  add(bollinger?.lower ?? null, '布林下軌'); add(bollinger?.middle ?? null, '布林中軌'); add(bollinger?.upper ?? null, '布林上軌')
  if (atr14 !== null) { add(currentPrice - atr14 * 2, 'ATR 安全區下緣'); add(currentPrice + atr14 * 2, 'ATR 安全區上緣') }
  const zones = buildPriceZones(candidates, series.prices.slice(-120), currentPrice, atr14)
  const supports = zones.filter((zone) => zone.type === 'support').sort((left, right) => right.center - left.center).slice(0, 4)
  const resistances = zones.filter((zone) => zone.type === 'resistance').sort((left, right) => left.center - right.center).slice(0, 4)
  if (!supports.length || !resistances.length) warnings.push('其中一側缺少足夠價位證據，未以推測值補齊。')
  return { formulaVersion: 'support-resistance-v1.0', tradeDate: series.lastTradeDate, currentPrice, atr14, zones: [...supports, ...resistances], supports, resistances, pivots, trend, sampleSize: series.sampleSize, warnings }
}
