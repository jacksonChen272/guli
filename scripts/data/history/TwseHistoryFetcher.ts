import type { HistoryFailureCategory, HistoryPricePoint } from './types.ts'
import { HistoryRateLimiter } from './HistoryRateLimiter.ts'
import { HistoryRequestError, HistoryRetryQueue } from './HistoryRetryQueue.ts'

export const TWSE_HISTORY_ENDPOINT = 'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY'
type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

const numeric = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const cleaned = String(value).trim().replaceAll(',', '').replace(/[^0-9+\-.]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '--') return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeTwseDate(value: unknown): string | null {
  const matched = String(value ?? '').trim().match(/^(\d{2,4})[/.-](\d{1,2})[/.-](\d{1,2})$/)
  if (!matched) return null
  let year = Number(matched[1]); const month = Number(matched[2]); const day = Number(matched[3])
  if (year < 1911) year += 1911
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null
}

const fieldIndex = (fields: unknown[], names: string[], fallback: number) => {
  const index = fields.findIndex((field) => names.some((name) => String(field).includes(name)))
  return index >= 0 ? index : fallback
}

export function normalizeTwseHistoryMonth(payload: unknown): { name: string | null; points: HistoryPricePoint[]; warnings: string[] } {
  if (!payload || typeof payload !== 'object') throw new HistoryRequestError('INVALID_RESPONSE', 'TWSE 回應不是物件')
  const source = payload as { fields?: unknown[]; data?: unknown[][]; title?: unknown; stat?: unknown }
  if (source.stat && source.stat !== 'OK') throw new HistoryRequestError('NO_DATA', String(source.stat), false)
  const fields = Array.isArray(source.fields) ? source.fields : []
  const rows = Array.isArray(source.data) ? source.data : []
  const indexes = {
    date: fieldIndex(fields, ['日期'], 0), volume: fieldIndex(fields, ['成交股數'], 1), amount: fieldIndex(fields, ['成交金額'], 2),
    open: fieldIndex(fields, ['開盤價'], 3), high: fieldIndex(fields, ['最高價'], 4), low: fieldIndex(fields, ['最低價'], 5),
    close: fieldIndex(fields, ['收盤價'], 6), change: fieldIndex(fields, ['漲跌價差'], 7), transactions: fieldIndex(fields, ['成交筆數'], 8),
  }
  const warnings: string[] = fields.length ? [] : ['TWSE 未提供欄位名稱，使用 STOCK_DAY 固定欄位順序']
  const points = rows.flatMap((row) => {
    const tradeDate = normalizeTwseDate(row[indexes.date])
    if (!tradeDate) { warnings.push(`略過無效日期：${String(row[indexes.date] ?? '')}`); return [] }
    return [{ tradeDate, open: numeric(row[indexes.open]), high: numeric(row[indexes.high]), low: numeric(row[indexes.low]), close: numeric(row[indexes.close]), change: numeric(row[indexes.change]), volume: numeric(row[indexes.volume]), tradingAmount: numeric(row[indexes.amount]), transactionCount: numeric(row[indexes.transactions]) }]
  })
  const title = String(source.title ?? '')
  return { name: title.match(/\d{4}\s+([^\s]+)\s+/)?.[1]?.trim() ?? null, points, warnings }
}

export function buildMonthKeys(startMonth: string | null, count: number, now = new Date()): string[] {
  const anchor = startMonth && /^\d{4}-\d{2}$/.test(startMonth) ? new Date(`${startMonth}-01T00:00:00Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - offset, 1))
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}01`
  })
}

export class TwseHistoryFetcher {
  private readonly fetcher: Fetcher
  private readonly limiter: HistoryRateLimiter
  private readonly retries: HistoryRetryQueue
  private readonly timeoutMs: number
  private totalRetries = 0
  private readonly errorCounts: Record<HistoryFailureCategory, number> = { RATE_LIMIT: 0, NETWORK_ERROR: 0, INVALID_RESPONSE: 0, NO_DATA: 0, PARSE_ERROR: 0, VALIDATION_ERROR: 0, UNKNOWN: 0 }
  constructor(
    fetcher: Fetcher = fetch,
    limiter = new HistoryRateLimiter(),
    retries = new HistoryRetryQueue(),
    timeoutMs = 15_000,
  ) { this.fetcher = fetcher; this.limiter = limiter; this.retries = retries; this.timeoutMs = timeoutMs }

  async fetchMonth(symbol: string, month: string) {
    const url = `${TWSE_HISTORY_ENDPOINT}?date=${month}&stockNo=${symbol}&response=json`
    let attempts = 0
    try {
      const result = await this.retries.run(async () => {
      attempts += 1
      await this.limiter.beforeRequest()
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const response = await this.fetcher(url, { signal: controller.signal, headers: { accept: 'application/json', 'user-agent': 'GULI-history-sync/1.1.1' } })
        if (response.status === 429 || response.status === 307) throw new HistoryRequestError('RATE_LIMIT', `TWSE HTTP ${response.status}`)
        if (!response.ok) throw new HistoryRequestError('NETWORK_ERROR', `TWSE HTTP ${response.status}`)
        const text = await response.text()
        if (!text.trim().startsWith('{')) throw new HistoryRequestError('INVALID_RESPONSE', 'TWSE 回應不是 JSON')
        try { return normalizeTwseHistoryMonth(JSON.parse(text)) }
        catch (error) { if (error instanceof HistoryRequestError) throw error; throw new HistoryRequestError('PARSE_ERROR', 'TWSE JSON 解析失敗') }
      } catch (error) {
        this.errorCounts[error instanceof HistoryRequestError ? error.category : 'UNKNOWN'] += 1
        throw error
      } finally { clearTimeout(timer); this.limiter.afterRequest() }
      })
      this.totalRetries += Math.max(0, result.attempts - 1)
      return result.value
    } catch (error) {
      this.totalRetries += Math.max(0, attempts - 1)
      throw error
    }
  }

  getMetrics() { return { totalRetries: this.totalRetries, errorCounts: { ...this.errorCounts } } }
}
