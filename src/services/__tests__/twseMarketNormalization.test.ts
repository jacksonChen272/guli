import { describe, expect, it } from 'vitest'
import { validateOfficialMarketOverview } from '../dataValidationService'
import { normalizeTWSEMarketOverview, toHundredMillionTWD, TWSE_SOURCE } from '../twseMarketNormalization'
import type { OfficialMarketOverview } from '../../types/marketData'

const raw = (overrides: Partial<Parameters<typeof normalizeTWSEMarketOverview>[0]> = {}) => ({
  index: { 日期: '1150713', 指數: '發行量加權股價指數', 收盤指數: '45,380.52', 漲跌: '+', 漲跌點數: '25.91', 漲跌百分比: '0.06' },
  trading: { Date: '1150713', TradeValue: '1,067,662,107,060' },
  breadth: { 出表日期: '1150713', 類型: '股票', 上漲: '512', 下跌: '421', 持平: '87' },
  fetchedAt: '2026-07-13T08:00:00.000Z', ...overrides,
})

describe('TWSE market normalization', () => {
  it('正常官方資料可正規化並保留官方來源', () => {
    const result = normalizeTWSEMarketOverview(raw())
    expect(result).toMatchObject({ market: 'TWSE', tradeDate: '2026-07-13', indexValue: 45380.52, status: 'official', source: TWSE_SOURCE })
  })
  it('帶逗號數值可正確轉換', () => expect(normalizeTWSEMarketOverview(raw()).tradingAmount).toBe(1067662107060))
  it('民國日期可轉為國曆', () => expect(normalizeTWSEMarketOverview(raw()).tradeDate).toBe('2026-07-13'))
  it('缺少上漲家數會變 partial 且保留 null', () => {
    const result = normalizeTWSEMarketOverview(raw({ breadth: { 出表日期: '1150713', 類型: '股票', 下跌: '421', 持平: '87' } }))
    expect(result.status).toBe('partial'); expect(result.advanceCount).toBeNull(); expect(result.warnings.length).toBeGreaterThan(0)
  })
  it('負成交金額會驗證失敗', () => {
    const data = normalizeTWSEMarketOverview(raw({ trading: { Date: '1150713', TradeValue: '-1' } }))
    expect(validateOfficialMarketOverview(data, new Date('2026-07-14T00:00:00Z')).errors).toContain('成交金額不可為負數。')
  })
  it('無效指數值會驗證失敗', () => {
    const data = normalizeTWSEMarketOverview(raw({ index: { 日期: '1150713', 指數: '發行量加權股價指數', 收盤指數: '0', 漲跌: '+', 漲跌點數: '1', 漲跌百分比: '0.1' } }))
    expect(validateOfficialMarketOverview(data, new Date('2026-07-14T00:00:00Z')).errors).toContain('加權指數必須為正數。')
  })
  it('過期資料會標示 stale，週末不會使週五資料立即過期', () => {
    const data = normalizeTWSEMarketOverview(raw())
    expect(validateOfficialMarketOverview(data, new Date('2026-07-19T00:00:00Z')).stale).toBe(true)
    const friday = { ...data, tradeDate: '2026-07-17' } satisfies OfficialMarketOverview
    expect(validateOfficialMarketOverview(friday, new Date('2026-07-19T00:00:00Z')).stale).toBe(false)
  })
  it('UI 金額由新臺幣元正確轉為億元', () => expect(toHundredMillionTWD(1067662107060)).toBeCloseTo(10676.6210706))
})
