import { describe, expect, it } from 'vitest'
import type { OfficialMarketOverview } from '../../types/marketData'
import { validateOfficialMarketOverview } from '../dataValidationService'
import {
  normalizeTWSEMarketOverview,
  toHundredMillionShares,
  toHundredMillionTWD,
  TWSE_SOURCE,
} from '../twseMarketNormalization'

const stockRows = () => [
  ...Array.from({ length: 12 }, (_, index) => ({
    Date: '1150715', Code: String(1101 + index), Name: `上漲股${index + 1}`,
    ClosingPrice: String(100 + index), Change: String(index + 1),
    TradeValue: String((index + 1) * 100_000_000), TradeVolume: String((index + 1) * 1_000_000),
  })),
  ...Array.from({ length: 12 }, (_, index) => ({
    Date: '1150715', Code: String(1201 + index), Name: `下跌股${index + 1}`,
    ClosingPrice: String(100 - index), Change: String(-(index + 1)),
    TradeValue: String((index + 20) * 100_000_000), TradeVolume: String((index + 20) * 1_000_000),
  })),
  { Date: '1150715', Code: '0050', Name: '元大台灣50', ClosingPrice: '200', Change: '20', TradeValue: '999999999999', TradeVolume: '999999999' },
]

const raw = (overrides: Partial<Parameters<typeof normalizeTWSEMarketOverview>[0]> = {}) => ({
  index: { 日期: '1150715', 指數: '發行量加權股價指數', 收盤指數: '45,631.59', 漲跌: '+', 漲跌點數: '893.64', 漲跌百分比: '2.00' },
  trading: [
    { Date: '1150714', TradeValue: '1,000,000,000,000', TradeVolume: '10,000,000,000', Transaction: '5,000,000', TAIEX: '44,737.95' },
    { Date: '1150715', TradeValue: '1,200,000,000,000', TradeVolume: '12,000,000,000', Transaction: '6,000,000', TAIEX: '45,631.59' },
  ],
  breadth: { 出表日期: '1150715', 類型: '股票', 上漲: '512', 下跌: '421', 持平: '87', 漲停: '19', 跌停: '10' },
  stocks: stockRows(), fetchedAt: '2026-07-15T08:00:00.000Z', ...overrides,
})

describe('TWSE market normalization v2', () => {
  it('正規化完整官方市場統計並保留 TWSE 來源', () => {
    const result = normalizeTWSEMarketOverview(raw())
    expect(result).toMatchObject({ schemaVersion: '2.0', market: 'TWSE', tradeDate: '2026-07-15', indexValue: 45631.59, status: 'official', source: TWSE_SOURCE })
  })
  it('帶逗號的成交值與成交量可正確轉換', () => {
    const result = normalizeTWSEMarketOverview(raw())
    expect(result.tradingAmount).toBe(1_200_000_000_000)
    expect(result.tradingVolume).toBe(12_000_000_000)
  })
  it('民國日期可轉為國曆日期', () => expect(normalizeTWSEMarketOverview(raw()).tradeDate).toBe('2026-07-15'))
  it('同交易日 twtazu_od 優先提供五項官方市場廣度', () => {
    const result = normalizeTWSEMarketOverview(raw())
    expect(result.breadthSource).toBe('twtazu_od')
    expect([result.advanceCount, result.declineCount, result.unchangedCount, result.limitUpCount, result.limitDownCount]).toEqual([512, 421, 87, 19, 10])
  })
  it('twtazu_od 日期落後時由同日 STOCK_DAY_ALL 官方資料彙整且不使用 Mock', () => {
    const result = normalizeTWSEMarketOverview(raw({ breadth: { 出表日期: '1150714', 類型: '股票', 上漲: '1' } }))
    expect(result.breadthSource).toBe('stock_day_all')
    expect([result.advanceCount, result.declineCount, result.unchangedCount]).toEqual([12, 12, 0])
    expect(result.warnings.join(' ')).toContain('STOCK_DAY_ALL')
  })
  it('四組排行各產生 10 筆', () => {
    const rankings = normalizeTWSEMarketOverview(raw()).rankings
    expect(Object.values(rankings).map((items) => items.length)).toEqual([10, 10, 10, 10])
  })
  it('排行榜只收錄四碼上市股票並排除 ETF', () => {
    const result = normalizeTWSEMarketOverview(raw())
    expect(Object.values(result.rankings).flat().some((item) => item.symbol === '0050')).toBe(false)
    expect(Object.values(result.rankings).flat().every((item) => /^\d{4}$/.test(item.symbol))).toBe(true)
  })
  it('成交值、成交量、漲幅與跌幅排行順序正確', () => {
    const rankings = normalizeTWSEMarketOverview(raw()).rankings
    expect(rankings.tradingAmount[0].tradingAmount).toBeGreaterThanOrEqual(rankings.tradingAmount[1].tradingAmount)
    expect(rankings.tradingVolume[0].tradingVolume).toBeGreaterThanOrEqual(rankings.tradingVolume[1].tradingVolume)
    expect(rankings.gainers[0].changePercent).toBeGreaterThanOrEqual(rankings.gainers[1].changePercent)
    expect(rankings.losers[0].changePercent).toBeLessThanOrEqual(rankings.losers[1].changePercent)
  })
  it('負成交值會驗證失敗', () => {
    const data = normalizeTWSEMarketOverview(raw({ trading: [{ Date: '1150715', TradeValue: '-1', TradeVolume: '1', Transaction: '1', TAIEX: '45631.59' }] }))
    expect(validateOfficialMarketOverview(data, new Date('2026-07-16T00:00:00Z')).errors).toContain('成交金額不可為負數。')
  })
  it('無效指數值會驗證失敗', () => {
    const data = normalizeTWSEMarketOverview(raw({ index: { 日期: '1150715', 指數: '發行量加權股價指數', 收盤指數: '0', 漲跌: '+', 漲跌點數: '1', 漲跌百分比: '0.1' } }))
    expect(validateOfficialMarketOverview(data, new Date('2026-07-16T00:00:00Z')).errors).toContain('加權指數必須為正數。')
  })
  it('過期資料標示 stale，週末不會將週五資料立即判為過期', () => {
    const data = normalizeTWSEMarketOverview(raw())
    expect(validateOfficialMarketOverview(data, new Date('2026-07-21T00:00:00Z')).stale).toBe(true)
    const friday = { ...data, tradeDate: '2026-07-17' } satisfies OfficialMarketOverview
    expect(validateOfficialMarketOverview(friday, new Date('2026-07-19T00:00:00Z')).stale).toBe(false)
  })
  it('UI 金額與成交量單位轉換正確', () => {
    expect(toHundredMillionTWD(1_200_000_000_000)).toBe(12_000)
    expect(toHundredMillionShares(12_000_000_000)).toBe(120)
  })
})
