import { describe, expect, it } from 'vitest'
import { HotStocksRepository, rankHotStocks } from '../HotStocksRepository'
import type { OfficialStockDailyRecord } from '../../types/officialStockData'

const stock = (symbol: string, value: number, volume: number, change: number, status: OfficialStockDailyRecord['status'] = 'official'): OfficialStockDailyRecord => ({ symbol, name: `股票${symbol}`, tradeDate: '2026-07-20', market: 'TWSE', instrumentType: 'stock', tradeVolume: volume, transactionCount: 100, tradeValue: value, open: 100, high: 110, low: 90, close: 100 + change, changeDirection: change > 0 ? 'up' : change < 0 ? 'down' : 'flat', change, bidPrice: null, bidVolume: null, askPrice: null, askVolume: null, peRatio: null, source: 'TWSE', fetchedAt: '2026-07-20T08:00:00Z', status, warnings: [] })
const records = [stock('2330', 1_000, 800, 5), stock('2454', 900, 700, 2), stock('2615', 600, 1_000, -8), stock('2317', 500, 400, 1), stock('1216', 300, 300, 0)]

describe('HotStocksRepository', () => {
  it('依成交值、成交量與絕對漲跌幅綜合排序', () => expect(rankHotStocks(records, 5)[0].symbol).toBe('2330'))
  it('熱門分數介於 0 到 100', () => rankHotStocks(records, 5).forEach((item) => { expect(item.hotScore).toBeGreaterThanOrEqual(0); expect(item.hotScore).toBeLessThanOrEqual(100) }))
  it('預設只回傳 Top 5', () => expect(rankHotStocks([...records, stock('2603', 100, 100, 1)])).toHaveLength(5))
  it('排除 invalid 資料', () => expect(rankHotStocks([...records, stock('9999', 9999, 9999, 9, 'invalid')])).not.toEqual(expect.arrayContaining([expect.objectContaining({ symbol: '9999' })])))
  it('排除缺少核心數值的資料', () => { const missing = { ...stock('9998', 9999, 9999, 9), tradeValue: null }; expect(rankHotStocks([...records, missing])).not.toEqual(expect.arrayContaining([expect.objectContaining({ symbol: '9998' })])) })
  it('結果明確標示 TWSE Official', () => expect(rankHotStocks(records, 1)[0].source).toBe('TWSE Official'))
  it('同分時使用代號確定性排序', () => { const tied = [stock('2222', 100, 100, 1), stock('1111', 100, 100, 1)]; expect(rankHotStocks(tied, 2).map((item) => item.symbol)).toEqual(['1111', '2222']) })
  it('Repository 快取有效結果', async () => { let calls = 0; const repository = new HotStocksRepository({ getStocks: async () => { calls += 1; return records } }); await repository.getTop(); await repository.getTop(); expect(calls).toBe(1) })
  it('clearCache 後重新計算', async () => { let calls = 0; const repository = new HotStocksRepository({ getStocks: async () => { calls += 1; return records } }); await repository.getTop(); repository.clearCache(); await repository.getTop(); expect(calls).toBe(2) })
})
