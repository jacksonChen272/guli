import { describe, expect, it } from 'vitest'
import { alignDataDates, tradingDayDistance } from '../data/DataDateAlignmentService'
import type { DateSourceRecord } from '../../types/screener'

const records = (dates: Array<string | null>): DateSourceRecord[] => dates.map((tradeDate, index) => ({ id: ['market', 'stock', 'institutional', 'history', 'snapshot', 'decision', 'technicalIndex'][index] as DateSourceRecord['id'], tradeDate }))
describe('Data Date Alignment', () => {
  it('同日為 aligned', () => expect(alignDataDates(records(['2026-07-16','2026-07-16'])).status).toBe('aligned'))
  it('差一交易日為 acceptable', () => expect(alignDataDates(records(['2026-07-15','2026-07-16'])).status).toBe('acceptable'))
  it('超過一交易日為 mismatched', () => expect(alignDataDates(records(['2026-07-13','2026-07-16'])).status).toBe('mismatched'))
  it('缺日期為 missing', () => expect(alignDataDates(records(['2026-07-16', null])).status).toBe('missing'))
  it('週末不算交易日', () => expect(tradingDayDistance('2026-07-17','2026-07-20')).toBe(1))
  it('aligned 不扣 Confidence', () => expect(alignDataDates(records(['2026-07-16','2026-07-16'])).confidencePenalty).toBe(0))
  it('acceptable 扣 8', () => expect(alignDataDates(records(['2026-07-15','2026-07-16'])).confidencePenalty).toBe(8))
  it('missing 扣分高於 acceptable', () => expect(alignDataDates(records(['2026-07-16', null])).confidencePenalty).toBeGreaterThan(alignDataDates(records(['2026-07-15','2026-07-16'])).confidencePenalty))
})
