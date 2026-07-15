import type { OfficialStockDailyDataset, OfficialStockDailyRecord } from '../../types/officialStockData'

export interface StockValidationResult { valid: boolean; errors: string[]; warnings: string[] }
const nullableNonNegative = (value: number | null) => value === null || (Number.isFinite(value) && value >= 0)
export function validateStockDailyRecord(record: OfficialStockDailyRecord): StockValidationResult {
  const errors: string[] = []; const warnings = [...record.warnings]
  if (!/^\d{4,6}[A-Z]?$/.test(record.symbol)) errors.push('證券代號格式無效。')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.tradeDate) || !Number.isFinite(Date.parse(`${record.tradeDate}T00:00:00Z`))) errors.push('交易日期無效。')
  for (const [name, value] of [['open',record.open],['high',record.high],['low',record.low],['close',record.close]] as const) if (value !== null && (!Number.isFinite(value) || value < 0)) errors.push(`${name} 不可為負數或非有限值。`)
  if (record.high !== null && record.low !== null && record.high < record.low) errors.push('最高價不可低於最低價。')
  if (record.high !== null) for (const [name,value] of [['open',record.open],['low',record.low],['close',record.close]] as const) if (value !== null && value > record.high) errors.push(`${name} 不可高於最高價。`)
  if (record.low !== null) for (const [name,value] of [['open',record.open],['high',record.high],['close',record.close]] as const) if (value !== null && value < record.low) errors.push(`${name} 不可低於最低價。`)
  if (!nullableNonNegative(record.tradeVolume)) errors.push('成交股數不可為負數。')
  if (!nullableNonNegative(record.transactionCount)) errors.push('成交筆數不可為負數。')
  if (!nullableNonNegative(record.tradeValue)) errors.push('成交金額不可為負數。')
  if (record.change !== null && !Number.isFinite(record.change)) errors.push('漲跌價差必須為有限數值。')
  if (!Number.isFinite(Date.parse(record.fetchedAt))) errors.push('抓取時間必須為有效 ISO 日期。')
  if ([record.bidPrice,record.bidVolume,record.askPrice,record.askVolume].every((value) => value === null)) warnings.push('官方日成交端點未提供最佳買賣價量。')
  return { valid: !errors.length, errors, warnings: [...new Set(warnings)] }
}
export function validateOfficialStockDataset(dataset: OfficialStockDailyDataset): StockValidationResult {
  const errors: string[] = []; const warnings = [...dataset.warnings]
  if (dataset.schemaVersion !== '1.0' || dataset.market !== 'TWSE') errors.push('資料集版本或市場別無效。')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataset.tradeDate)) errors.push('資料集交易日期無效。')
  if (!Number.isFinite(Date.parse(dataset.fetchedAt))) errors.push('資料集抓取時間無效。')
  if (!dataset.source.endpoint.includes('openapi.twse.com.tw')) errors.push('資料來源不是 TWSE 官方 OpenAPI。')
  if (!Array.isArray(dataset.records) || !dataset.records.length) errors.push('資料集沒有有效紀錄。')
  return { valid: !errors.length, errors, warnings }
}
export const isStockDatasetStale = (tradeDate: string, now = new Date()) => {
  const date = new Date(`${tradeDate}T00:00:00Z`); if (!Number.isFinite(date.getTime())) return true
  return now.getTime() - date.getTime() > 4 * 24 * 60 * 60 * 1000
}
