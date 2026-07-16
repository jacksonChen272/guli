import { describe, expect, it } from 'vitest'
import { normalizeInstitutionalDataset, normalizeTWSEDate, parseInstitutionalNumber, type TWSETableResponse } from '../InstitutionalNormalizer'
import { isInstitutionalStale, validateInstitutionalDataset, validateInstitutionalRecord } from '../InstitutionalValidator'

const market = (overrides: Partial<TWSETableResponse> = {}): TWSETableResponse => ({ date: '20260716', stat: 'OK', data: [['自營商(自行買賣)', '1,000', '800', '200'], ['自營商(避險)', '500', '700', '-200'], ['投信', '2,000', '1,500', '500'], ['外資及陸資(不含外資自營商)', '10,000', '12,000', '-2,000'], ['合計', '13,500', '15,000', '-1,500']], ...overrides })
const stockRow = (symbol = '2330', values: Partial<Record<number, unknown>> = {}) => { const row: unknown[] = Array(19).fill('0'); row[0] = symbol; row[1] = '台積電'; row[4] = '1,200'; row[10] = '-300'; row[11] = '50'; row[18] = '950'; Object.entries(values).forEach(([key, value]) => { row[Number(key)] = value }); return row }
const stocks = (rows: unknown[][] = [stockRow()]): TWSETableResponse => ({ date: '20260716', stat: 'OK', data: rows })
const normalized = () => normalizeInstitutionalDataset(market(), stocks(), '2026-07-16T08:00:00.000Z')

describe('TWSE institutional normalization and validation', () => {
  it('移除逗號並轉為 number', () => expect(parseInstitutionalNumber('1,234,567')).toBe(1234567))
  it('保留負買賣超', () => expect(parseInstitutionalNumber('-12,345')).toBe(-12345))
  it('破折號轉為 null', () => expect(parseInstitutionalNumber('--')).toBeNull())
  it('民國日期轉國曆', () => expect(normalizeTWSEDate('1150716')).toBe('2026-07-16'))
  it('西元日期正規化', () => expect(normalizeTWSEDate('2026/07/16')).toBe('2026-07-16'))
  it('單位固定為元與股', () => expect(normalized().units).toEqual({ marketTotals: 'TWD', stockNet: 'shares' }))
  it('自營商市場金額合併自行買賣與避險', () => expect(normalized().marketTotals.dealer).toEqual({ buyAmount: 1500, sellAmount: 1500, netAmount: 0 }))
  it('個股欄位依 T86 正確 mapping', () => expect(normalized().records[0]).toMatchObject({ symbol: '2330', foreignNetShares: 1200, trustNetShares: -300, dealerNetShares: 50, totalNetShares: 950 }))
  it('ETF 與非四碼普通股不進入個股資料', () => expect(normalizeInstitutionalDataset(market(), stocks([stockRow('00665L'), stockRow('2330')]), '2026-07-16T08:00:00.000Z').records.map((item) => item.symbol)).toEqual(['2330']))
  it('缺少個股欄位時標示 partial 且保留 null', () => { const data = normalizeInstitutionalDataset(market(), stocks([stockRow('2330', { 4: '--' })]), '2026-07-16T08:00:00.000Z'); expect(data.records[0].foreignNetShares).toBeNull(); expect(data.records[0].status).toBe('partial'); expect(data.status).toBe('partial') })
  it('重複代號產生 warning 並驗證失敗', () => { const data = normalizeInstitutionalDataset(market(), stocks([stockRow(), stockRow()]), '2026-07-16T08:00:00.000Z'); expect(data.records[1].warnings[0]).toContain('重複'); expect(validateInstitutionalDataset(data).valid).toBe(false) })
  it('負買進金額驗證失敗', () => { const data = normalized(); data.marketTotals.foreign.buyAmount = -1; expect(validateInstitutionalDataset(data).errors).toContain('買進金額不可為負數。') })
  it('市場及個股 net 允許負數', () => { const data = normalized(); expect(data.marketTotals.foreign.netAmount).toBe(-2000); expect(validateInstitutionalDataset(data).valid).toBe(true); expect(validateInstitutionalRecord({ ...data.records[0], totalNetShares: -999 }).valid).toBe(true) })
  it('非 TWSE 來源驗證失敗', () => { const record = { ...normalized().records[0], source: 'OTHER' as 'TWSE' }; expect(validateInstitutionalRecord(record).valid).toBe(false) })
  it('過舊交易日標示 stale', () => expect(isInstitutionalStale('2026-06-01', new Date('2026-07-16T08:00:00Z'))).toBe(true))
  it('最近交易日不標示 stale', () => expect(isInstitutionalStale('2026-07-16', new Date('2026-07-16T08:00:00Z'))).toBe(false))
})
