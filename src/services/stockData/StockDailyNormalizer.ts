import type { OfficialStockDailyRecord } from '../../types/officialStockData'
import { classifyStockInstrument } from './StockInstrumentClassifier'

export type RawStockDailyRow = Record<string, unknown>
const emptyValues = new Set(['', '--', '---', '-', 'N/A', 'null', 'undefined'])
export const normalizeStockNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const text = String(value).trim()
  if (emptyValues.has(text)) return null
  const normalized = text.replace(/,/g, '').replace(/[^0-9.+-]/g, '')
  if (!normalized || normalized === '+' || normalized === '-') return null
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}
export const normalizeTwseStockDate = (value: unknown): string | null => {
  const digits = String(value ?? '').trim().replace(/[^0-9]/g, '')
  if (/^\d{7}$/.test(digits)) { const year = Number(digits.slice(0, 3)) + 1911; const date = `${year}-${digits.slice(3, 5)}-${digits.slice(5, 7)}`; return Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ? date : null }
  if (/^\d{8}$/.test(digits)) { const date = `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`; return Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ? date : null }
  return null
}
const field = (row: RawStockDailyRow, ...keys: string[]) => keys.map((key) => row[key]).find((value) => value !== undefined)

export function normalizeStockDailyRecord(row: RawStockDailyRow, fetchedAt: string, peRatio?: number | null): OfficialStockDailyRecord {
  const symbol = String(field(row, 'Code', '證券代號', 'symbol') ?? '').trim()
  const name = String(field(row, 'Name', '證券名稱', 'name') ?? '').trim()
  const tradeDate = normalizeTwseStockDate(field(row, 'Date', '日期', 'tradeDate')) ?? ''
  const change = normalizeStockNumber(field(row, 'Change', '漲跌價差', 'change'))
  const warnings: string[] = []
  if (!tradeDate) warnings.push('交易日期無法正規化。')
  const quoteValues = ['OpeningPrice','HighestPrice','LowestPrice','ClosingPrice'].map((key) => normalizeStockNumber(row[key]))
  if (quoteValues.some((value) => value === null)) warnings.push('部分 OHLC 欄位缺值。')
  const instrumentType = classifyStockInstrument(symbol, name)
  if (instrumentType === 'unknown') warnings.push('商品類型無法可靠判定。')
  return {
    symbol, name, tradeDate, market: 'TWSE', instrumentType,
    tradeVolume: normalizeStockNumber(field(row, 'TradeVolume', '成交股數')),
    transactionCount: normalizeStockNumber(field(row, 'Transaction', '成交筆數')),
    tradeValue: normalizeStockNumber(field(row, 'TradeValue', '成交金額')),
    open: quoteValues[0], high: quoteValues[1], low: quoteValues[2], close: quoteValues[3],
    changeDirection: change === null ? 'none' : change > 0 ? 'up' : change < 0 ? 'down' : 'flat', change,
    bidPrice: null, bidVolume: null, askPrice: null, askVolume: null, peRatio: peRatio ?? null,
    source: 'TWSE', fetchedAt, status: warnings.length ? 'partial' : 'official', warnings,
  }
}
