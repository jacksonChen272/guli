import { normalizeDate } from '../dataNormalizationService'
import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'

export interface TwseMonthlyStockResponse {
  stat?: string
  title?: string
  fields?: unknown[]
  data?: unknown[][]
}

const numeric = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const cleaned = String(value).trim().replaceAll(',', '').replace(/[^0-9+\-.]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '--') return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const fieldIndex = (fields: unknown[], names: string[], fallback: number) => {
  const index = fields.findIndex((field) => names.some((name) => String(field).includes(name)))
  return index >= 0 ? index : fallback
}

export function normalizeTwseStockHistoryRows(response: TwseMonthlyStockResponse): OfficialStockHistoryPrice[] {
  const fields = Array.isArray(response.fields) ? response.fields : []
  const indexes = {
    date: fieldIndex(fields, ['日期'], 0),
    volume: fieldIndex(fields, ['成交股數'], 1),
    amount: fieldIndex(fields, ['成交金額'], 2),
    open: fieldIndex(fields, ['開盤價'], 3),
    high: fieldIndex(fields, ['最高價'], 4),
    low: fieldIndex(fields, ['最低價'], 5),
    close: fieldIndex(fields, ['收盤價'], 6),
    change: fieldIndex(fields, ['漲跌價差'], 7),
    transactions: fieldIndex(fields, ['成交筆數'], 8),
  }
  return (Array.isArray(response.data) ? response.data : []).flatMap((row) => {
    const tradeDate = normalizeDate(row[indexes.date])
    if (!tradeDate) return []
    return [{
      tradeDate,
      open: numeric(row[indexes.open]),
      high: numeric(row[indexes.high]),
      low: numeric(row[indexes.low]),
      close: numeric(row[indexes.close]),
      change: numeric(row[indexes.change]),
      volume: numeric(row[indexes.volume]),
      tradingAmount: numeric(row[indexes.amount]),
      transactionCount: numeric(row[indexes.transactions]),
    }]
  })
}

export function parseStockName(title: string | undefined, fallback: string) {
  if (!title) return fallback
  const match = title.match(/\d{4}\s+([^\s]+)\s+/)
  return match?.[1]?.trim() || fallback
}

