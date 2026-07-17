import { describe, expect, it } from 'vitest'
import { normalizeTwseStockHistoryRows, parseStockName } from '../stockHistory/StockHistoryNormalizer'
import { mergeStockHistory } from '../stockHistory/StockHistoryMergeService'
import { getHistoryRange, getRecentHistory } from '../stockHistory/StockHistoryService'
import { isHistoryStale, validateHistoryPoint, validateOfficialStockHistory } from '../stockHistory/StockHistoryValidator'
import type { OfficialStockHistory, OfficialStockHistoryPrice } from '../../types/officialStockHistory'

const point = (tradeDate: string, close = 100): OfficialStockHistoryPrice => ({ tradeDate, open: close - 1, high: close + 2, low: close - 2, close, change: 1, volume: 1_000, tradingAmount: 100_000, transactionCount: 100 })
const dataset = (prices: OfficialStockHistoryPrice[]): OfficialStockHistory => ({ schemaVersion: '1.0', symbol: '2330', name: '台積電', market: 'TWSE', source: 'TWSE', sourceUrl: 'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY', fetchedAt: '2026-07-17T08:00:00.000Z', firstTradeDate: prices[0]?.tradeDate ?? null, lastTradeDate: prices.at(-1)?.tradeDate ?? null, recordCount: prices.length, status: 'official', warnings: [], prices })

describe('TWSE stock history normalization and validation', () => {
  it('normalizes ROC date and comma values', () => { const [row] = normalizeTwseStockHistoryRows({ fields: ['日期', '成交股數', '成交金額', '開盤價', '最高價', '最低價', '收盤價', '漲跌價差', '成交筆數'], data: [['115/07/16', '1,234', '99,000', '100', '102', '99', '101', '+1', '88']] }); expect(row).toMatchObject({ tradeDate: '2026-07-16', volume: 1234, tradingAmount: 99000, close: 101, change: 1 }) })
  it('keeps missing numeric fields as null', () => { const [row] = normalizeTwseStockHistoryRows({ data: [['115/07/16', '--', '-', '', '102', '99', '101', 'X0.00', '--']] }); expect(row.volume).toBeNull(); expect(row.open).toBeNull(); expect(row.transactionCount).toBeNull() })
  it('ignores invalid dates', () => { expect(normalizeTwseStockHistoryRows({ data: [['not-a-date']] })).toEqual([]) })
  it('parses the stock name from TWSE title', () => { expect(parseStockName('115年07月 2330 台積電 各日成交資訊', '2330')).toBe('台積電') })
  it('merges, deduplicates and sorts dates', () => { const result = mergeStockHistory([point('2026-07-02', 100), point('2026-07-01', 99)], [point('2026-07-02', 102)]); expect(result.map((item) => item.tradeDate)).toEqual(['2026-07-01', '2026-07-02']); expect(result[1].close).toBe(102) })
  it('rejects a negative volume', () => { expect(validateHistoryPoint({ ...point('2026-07-01'), volume: -1 })).toContain('價格、成交量、成交值與筆數不可為負數') })
  it('rejects high below close', () => { expect(validateHistoryPoint({ ...point('2026-07-01'), high: 90, close: 100 })).toContain('最高價低於 OHLC 其他價格') })
  it('rejects low above open', () => { expect(validateHistoryPoint({ ...point('2026-07-01'), low: 110 })).toContain('最低價高於 OHLC 其他價格') })
  it('accepts null OHLC without fabricating zero', () => { expect(validateHistoryPoint({ ...point('2026-07-01'), open: null, high: null })).toEqual([]) })
  it('rejects duplicate dates at dataset level', () => { expect(validateOfficialStockHistory(dataset([point('2026-07-01'), point('2026-07-01')])).valid).toBe(false) })
  it('rejects recordCount mismatch', () => { const value = dataset([point('2026-07-01')]); value.recordCount = 2; expect(validateOfficialStockHistory(value).errors).toContain('recordCount 與 prices 筆數不一致') })
  it('rejects non-official source URL', () => { const value = dataset([point('2026-07-01')]); value.sourceUrl = 'https://example.com'; expect(validateOfficialStockHistory(value).valid).toBe(false) })
  it('marks old data stale but does not treat weekend specially as invalid', () => { expect(isHistoryStale('2026-07-10', new Date('2026-07-17T12:00:00Z'))).toBe(true); expect(isHistoryStale('2026-07-17', new Date('2026-07-19T12:00:00Z'))).toBe(false) })
  it('selects recent actual records', () => { const value = dataset([point('2026-07-01'), point('2026-07-02'), point('2026-07-03')]); expect(getRecentHistory(value, 2).map((item) => item.tradeDate)).toEqual(['2026-07-02', '2026-07-03']) })
  it('selects an inclusive date range', () => { const value = dataset([point('2026-07-01'), point('2026-07-02'), point('2026-07-03')]); expect(getHistoryRange(value, '2026-07-02', '2026-07-03')).toHaveLength(2) })
})

