import { describe, expect, it } from 'vitest'
import { mergeHistoryPoints, sanitizeHistoryPoints, validateHistoryDataset } from '../../../../scripts/data/history/HistoryValidator.ts'
import type { TwseHistoryDataset } from '../../../../scripts/data/history/types.ts'

const point = (date: string, close = 10) => ({ tradeDate: date, open: 9, high: 11, low: 8, close, change: 1, volume: 100, tradingAmount: 1000, transactionCount: 10 })
const dataset = (prices = [point('2026-07-15'), point('2026-07-16')]): TwseHistoryDataset => ({ schemaVersion: '1.0', symbol: '2330', name: '台積電', market: 'TWSE', source: 'TWSE', sourceUrl: 'https://www.twse.com.tw/', fetchedAt: '2026-07-16T09:00:00.000Z', firstTradeDate: prices[0]?.tradeDate ?? null, lastTradeDate: prices.at(-1)?.tradeDate ?? null, recordCount: prices.length, status: 'partial', warnings: [], prices })

describe('History Validator', () => {
  it('accepts a valid ascending dataset', () => expect(validateHistoryDataset(dataset()).valid).toBe(true))
  it('rejects duplicate dates', () => expect(validateHistoryDataset(dataset([point('2026-07-16'), point('2026-07-16')])).errors).toContain('重複交易日 2026-07-16'))
  it('rejects invalid OHLC bounds', () => expect(validateHistoryDataset(dataset([{ ...point('2026-07-16'), high: 7 }])).valid).toBe(false))
  it('rejects non-positive close', () => expect(validateHistoryDataset(dataset([point('2026-07-16', 0)])).valid).toBe(false))
  it('deduplicates incremental updates with incoming data winning', () => expect(mergeHistoryPoints([point('2026-07-16', 10)], [point('2026-07-16', 12), point('2026-07-17', 13)]).map((row) => row.close)).toEqual([12, 13]))
  it('removes official rows without a usable price instead of filling zero', () => { const result = sanitizeHistoryPoints([{ ...point('2026-07-16'), open: null }, point('2026-07-17')]); expect(result).toMatchObject({ rejected: 1 }); expect(result.points).toHaveLength(1) })
})
