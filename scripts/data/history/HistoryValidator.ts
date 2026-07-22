import type { HistoryPricePoint, TwseHistoryDataset } from './types.ts'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

export interface HistoryValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  recordCount: number
}

export function validateHistoryPoint(point: HistoryPricePoint, index: number): string[] {
  const errors: string[] = []
  const prefix = `prices[${index}]`
  if (!DATE_PATTERN.test(point.tradeDate) || Number.isNaN(Date.parse(`${point.tradeDate}T00:00:00Z`))) errors.push(`${prefix}.tradeDate 無效`)
  for (const field of ['open', 'high', 'low', 'close'] as const) {
    if (!finite(point[field])) errors.push(`${prefix}.${field} 必須是有限數值`)
  }
  if (finite(point.close) && point.close <= 0) errors.push(`${prefix}.close 必須大於 0`)
  if (!finite(point.volume) || point.volume < 0) errors.push(`${prefix}.volume 不可為負數`)
  if (point.tradingAmount !== null && (!finite(point.tradingAmount) || point.tradingAmount < 0)) errors.push(`${prefix}.tradingAmount 無效`)
  if (point.transactionCount !== null && (!finite(point.transactionCount) || point.transactionCount < 0)) errors.push(`${prefix}.transactionCount 無效`)
  if (point.change !== null && !finite(point.change)) errors.push(`${prefix}.change 無效`)
  if ([point.open, point.high, point.low, point.close].every(finite)) {
    if (point.high < Math.max(point.open, point.low, point.close)) errors.push(`${prefix}.high 低於 OHLC 其他值`)
    if (point.low > Math.min(point.open, point.high, point.close)) errors.push(`${prefix}.low 高於 OHLC 其他值`)
  }
  return errors
}

export function validateHistoryDataset(dataset: TwseHistoryDataset, expectedSymbol = dataset.symbol): HistoryValidationResult {
  const errors: string[] = []
  const warnings: string[] = [...(dataset.warnings ?? [])]
  if (!/^\d{4}$/.test(dataset.symbol) || dataset.symbol !== expectedSymbol) errors.push('股票代號與檔名不一致')
  if (dataset.market !== 'TWSE' || dataset.source !== 'TWSE') errors.push('來源必須為 TWSE 官方資料')
  if (!Number.isFinite(Date.parse(dataset.fetchedAt))) errors.push('fetchedAt 必須為有效 ISO 日期')
  if (!Array.isArray(dataset.prices)) errors.push('prices 必須為陣列')
  const dates = new Set<string>()
  let previous = ''
  for (const [index, point] of dataset.prices.entries()) {
    errors.push(...validateHistoryPoint(point, index))
    if (dates.has(point.tradeDate)) errors.push(`重複交易日 ${point.tradeDate}`)
    if (previous && point.tradeDate <= previous) errors.push(`交易日未嚴格遞增 ${point.tradeDate}`)
    dates.add(point.tradeDate)
    previous = point.tradeDate
  }
  if (dataset.recordCount !== dataset.prices.length) errors.push('recordCount 與 prices 長度不一致')
  if ((dataset.firstTradeDate ?? null) !== (dataset.prices[0]?.tradeDate ?? null)) errors.push('firstTradeDate 不一致')
  if ((dataset.lastTradeDate ?? null) !== (dataset.prices.at(-1)?.tradeDate ?? null)) errors.push('lastTradeDate 不一致')
  if (dataset.prices.length < 120) warnings.push('歷史交易日少於 120 日，部分技術指標不可計算')
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)], recordCount: dataset.prices.length }
}

export function mergeHistoryPoints(existing: HistoryPricePoint[], incoming: HistoryPricePoint[]): HistoryPricePoint[] {
  const byDate = new Map<string, HistoryPricePoint>()
  for (const point of [...existing, ...incoming]) byDate.set(point.tradeDate, point)
  return [...byDate.values()].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate))
}

export function sanitizeHistoryPoints(points: HistoryPricePoint[]): { points: HistoryPricePoint[]; rejected: number } {
  const normalized = mergeHistoryPoints([], points)
  const valid = normalized.filter((point) => [point.open, point.high, point.low, point.close].every(finite) && (point.close as number) > 0 && finite(point.volume) && point.volume >= 0)
  return { points: valid, rejected: normalized.length - valid.length }
}
