import { describe, expect, it } from 'vitest'
import { buildMonthKeys, normalizeTwseDate, normalizeTwseHistoryMonth } from '../../../../scripts/data/history/TwseHistoryFetcher.ts'

describe('TWSE History Fetcher', () => {
  it('normalizes ROC dates and comma numbers', () => {
    const result = normalizeTwseHistoryMonth({ stat: 'OK', title: '1101 台泥 115年07月', fields: ['日期', '成交股數', '成交金額', '開盤價', '最高價', '最低價', '收盤價', '漲跌價差', '成交筆數'], data: [['115/07/16', '1,234', '40,000', '30.0', '32.0', '29.5', '31.5', '+1.0', '88']] })
    expect(result.points[0]).toMatchObject({ tradeDate: '2026-07-16', volume: 1234, close: 31.5 })
  })
  it('rejects invalid calendar dates', () => expect(normalizeTwseDate('115/02/30')).toBeNull())
  it('builds deterministic descending month keys', () => expect(buildMonthKeys('2026-07', 3)).toEqual(['20260701', '20260601', '20260501']))
  it('classifies an official no-data response', () => expect(() => normalizeTwseHistoryMonth({ stat: '很抱歉，沒有符合條件的資料!' })).toThrow(/沒有符合/))
})
