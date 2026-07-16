import type { RawMarketRecord } from '../types/api'
import { normalizeDate, normalizeNumber, normalizeStockSymbol } from './dataNormalizationService'
import type { OfficialMarketOverview } from '../types/marketData'
import { TWSE_SOURCE } from './twseMarketNormalization'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  normalized: { symbol: string | null; date: string | null; price: number | null; volume: number | null; institutionalFlow: number | null; source: string; updatedAt: string | null }
}

export const isValidStockSymbol = (value: unknown) => normalizeStockSymbol(value) !== null
export const isValidDate = (value: unknown) => normalizeDate(value) !== null

export function validateMarketRecord(record: RawMarketRecord): ValidationResult {
  const symbol = normalizeStockSymbol(record.symbol)
  const date = normalizeDate(record.date)
  const price = normalizeNumber(record.price)
  const volume = normalizeNumber(record.volume)
  const institutionalFlow = normalizeNumber(record.institutionalFlow)
  const errors: string[] = []
  const warnings: string[] = []
  if (!symbol) errors.push('股票代號格式不正確')
  if (!date) errors.push('日期格式不正確')
  if (price === null) warnings.push('價格資料缺失')
  else if (price < 0) errors.push('價格不可為負數')
  if (volume === null) warnings.push('成交量資料缺失')
  else if (volume < 0) errors.push('成交量不可為負數')
  if (institutionalFlow === null) warnings.push('法人買賣超資料缺失')
  const source = typeof record.source === 'string' && record.source.trim() ? record.source.trim() : '未知來源'
  const updatedAt = normalizeDate(record.updatedAt)
  if (!updatedAt) warnings.push('來源更新時間缺失或格式不正確')
  return { valid: errors.length === 0, errors, warnings, normalized: { symbol, date, price, volume, institutionalFlow, source, updatedAt } }
}

export interface OfficialMarketValidationResult {
  valid: boolean
  stale: boolean
  errors: string[]
  warnings: string[]
}

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && normalizeDate(value) === value
const isValidIsoTimestamp = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value))

export function businessDaysBetween(from: string, to: Date) {
  const start = new Date(`${from}T00:00:00+08:00`)
  const end = new Date(to.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }) + 'T00:00:00+08:00')
  if (!Number.isFinite(start.getTime()) || start >= end) return 0
  let days = 0
  for (let cursor = new Date(start.getTime() + 86_400_000); cursor <= end; cursor = new Date(cursor.getTime() + 86_400_000)) {
    const weekday = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', weekday: 'short' }).formatToParts(cursor).find((part) => part.type === 'weekday')?.value === 'Sun' ? 0 : cursor.getDay())
    if (weekday !== 0 && weekday !== 6) days += 1
  }
  return days
}

export function validateOfficialMarketOverview(data: OfficialMarketOverview, now = new Date()): OfficialMarketValidationResult {
  const errors: string[] = []
  const warnings = [...data.warnings]
  if (!isIsoDate(data.tradeDate)) errors.push('交易日期必須為 YYYY-MM-DD。')
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
  if (isIsoDate(data.tradeDate) && data.tradeDate > today) errors.push('交易日期不可晚於目前日期。')
  if (!Number.isFinite(data.indexValue) || data.indexValue <= 0) errors.push('加權指數必須為正數。')
  if (!Number.isFinite(data.change)) errors.push('漲跌點必須為有限數值。')
  if (!Number.isFinite(data.changePercent)) errors.push('漲跌幅必須為有限數值。')
  if (!Number.isFinite(data.tradingAmount) || data.tradingAmount < 0) errors.push('成交金額不可為負數。')
  if (!Number.isFinite(data.tradingVolume) || data.tradingVolume < 0) errors.push('成交量不可為負數。')
  if (!Number.isInteger(data.transactionCount) || data.transactionCount < 0) errors.push('成交筆數必須為非負整數。')
  for (const [label, value] of [
    ['上漲家數', data.advanceCount], ['下跌家數', data.declineCount], ['平盤家數', data.unchangedCount],
    ['漲停家數', data.limitUpCount], ['跌停家數', data.limitDownCount],
  ] as const) if (value !== null && (!Number.isInteger(value) || value < 0)) errors.push(`${label}必須為非負整數。`)
  if (!['twtazu_od', 'stock_day_all'].includes(data.breadthSource)) errors.push('市場廣度來源無效。')
  if (!data.tradingHistory.length) errors.push('市場成交歷史不可為空。')
  for (const point of data.tradingHistory) {
    if (!isIsoDate(point.tradeDate) || point.tradeDate > data.tradeDate) errors.push('市場成交歷史日期無效。')
    if (!Number.isFinite(point.indexValue) || point.indexValue <= 0) errors.push('市場成交歷史指數值無效。')
    if (!Number.isFinite(point.tradingAmount) || point.tradingAmount < 0 || !Number.isFinite(point.tradingVolume) || point.tradingVolume < 0) errors.push('市場成交歷史量值無效。')
  }
  for (const [label, items] of [
    ['成交值排行', data.rankings.tradingAmount], ['成交量排行', data.rankings.tradingVolume],
    ['漲幅排行', data.rankings.gainers], ['跌幅排行', data.rankings.losers],
  ] as const) {
    if (items.length !== 10) errors.push(`${label}必須包含 10 筆。`)
    if (new Set(items.map((item) => item.symbol)).size !== items.length) errors.push(`${label}不可包含重複股票。`)
    for (const item of items) if (!/^\d{4}$/.test(item.symbol) || /^00/.test(item.symbol) || !item.name || !Number.isFinite(item.close) || item.close <= 0
      || !Number.isFinite(item.change) || !Number.isFinite(item.changePercent) || !Number.isFinite(item.tradingAmount) || item.tradingAmount < 0
      || !Number.isFinite(item.tradingVolume) || item.tradingVolume < 0) errors.push(`${label}包含無效資料。`)
  }
  if (!isValidIsoTimestamp(data.fetchedAt)) errors.push('抓取時間必須是有效 ISO 日期。')
  if (data.source !== TWSE_SOURCE || !data.sourceUrl?.includes('openapi.twse.com.tw')) errors.push('來源必須是 TWSE 官方 OpenAPI。')
  if ([data.advanceCount, data.declineCount, data.unchangedCount, data.limitUpCount, data.limitDownCount].some((value) => value === null)
    && !warnings.includes('TWSE 官方市場廣度欄位不完整，缺值保留 null。')) warnings.push('TWSE 官方市場廣度欄位不完整，缺值保留 null。')
  const stale = isIsoDate(data.tradeDate) && businessDaysBetween(data.tradeDate, now) > 2
  if (stale) warnings.push('資料已超過兩個合理交易日，請確認同步工作是否正常。')
  return { valid: errors.length === 0, stale, errors, warnings: [...new Set(warnings)] }
}
