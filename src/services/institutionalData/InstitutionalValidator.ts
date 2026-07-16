import type { OfficialInstitutionalDataset, OfficialStockInstitutionalRecord } from '../../types/officialInstitutionalData'

export interface InstitutionalValidationResult { valid: boolean; errors: string[]; warnings: string[] }
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const finiteOrNull = (value: number | null) => value === null || Number.isFinite(value)
export const isInstitutionalStale = (tradeDate: string, now = new Date()) => {
  const date = new Date(`${tradeDate}T23:59:59+08:00`)
  if (!Number.isFinite(date.getTime())) return true
  let cursor = new Date(date)
  let businessDays = 0
  while (cursor < now && businessDays <= 3) { cursor.setDate(cursor.getDate() + 1); if (cursor.getDay() !== 0 && cursor.getDay() !== 6 && cursor < now) businessDays++ }
  return businessDays > 2
}

export function validateInstitutionalRecord(record: OfficialStockInstitutionalRecord): InstitutionalValidationResult {
  const errors: string[] = []
  if (!/^\d{4,6}$/.test(record.symbol)) errors.push('股票代號格式錯誤。')
  if (!datePattern.test(record.tradeDate) || !Number.isFinite(new Date(`${record.tradeDate}T00:00:00Z`).getTime())) errors.push('交易日期格式錯誤。')
  if (!Number.isFinite(new Date(record.fetchedAt).getTime())) errors.push('fetchedAt 不是有效 ISO 日期。')
  if (record.source !== 'TWSE') errors.push('個股法人資料來源不是 TWSE。')
  for (const value of [record.foreignNetShares, record.trustNetShares, record.dealerNetShares, record.totalNetShares]) if (!finiteOrNull(value)) errors.push('個股法人買賣超必須是有限數值或 null。')
  return { valid: errors.length === 0, errors, warnings: [...record.warnings] }
}

export function validateInstitutionalDataset(dataset: OfficialInstitutionalDataset): InstitutionalValidationResult {
  const errors: string[] = []
  const warnings = [...dataset.warnings]
  if (dataset.schemaVersion !== '1.0' || dataset.market !== 'TWSE') errors.push('法人資料集 schema 或市場錯誤。')
  if (!datePattern.test(dataset.tradeDate)) errors.push('交易日期格式錯誤。')
  if (!Number.isFinite(new Date(dataset.fetchedAt).getTime())) errors.push('fetchedAt 不是有效 ISO 日期。')
  if (dataset.units.marketTotals !== 'TWD' || dataset.units.stockNet !== 'shares') errors.push('法人資料單位不一致。')
  if (!dataset.source.marketEndpoint.includes('twse.com.tw') || !dataset.source.stockEndpoint.includes('twse.com.tw')) errors.push('資料來源不是 TWSE 官方端點。')
  for (const amount of Object.values(dataset.marketTotals)) {
    if (amount.buyAmount !== null && (!Number.isFinite(amount.buyAmount) || amount.buyAmount < 0)) errors.push('買進金額不可為負數。')
    if (amount.sellAmount !== null && (!Number.isFinite(amount.sellAmount) || amount.sellAmount < 0)) errors.push('賣出金額不可為負數。')
    if (!finiteOrNull(amount.netAmount)) errors.push('買賣差額必須是有限數值或 null。')
  }
  const seen = new Set<string>()
  dataset.records.forEach((record) => { const result = validateInstitutionalRecord(record); errors.push(...result.errors); if (seen.has(record.symbol)) errors.push(`重複股票代號：${record.symbol}`); seen.add(record.symbol) })
  if (dataset.records.length === 0) errors.push('法人資料集不得為空。')
  else if (dataset.records.length < 100) warnings.push(`資料筆數異常偏低：${dataset.records.length} 筆。`)
  if (isInstitutionalStale(dataset.tradeDate)) warnings.push('法人資料可能已過期。')
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] }
}
