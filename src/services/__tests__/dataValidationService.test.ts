import { describe, expect, it } from 'vitest'
import { normalizeDate, normalizeNumber } from '../dataNormalizationService'
import { validateMarketRecord } from '../dataValidationService'

describe('data normalization and validation', () => {
  it('移除逗號並將字串數字轉為 number', () => { expect(normalizeNumber('1,234.50')).toBe(1234.5); expect(normalizeNumber('—')).toBeNull() })
  it('民國日期正規化為 YYYY-MM-DD', () => { expect(normalizeDate('115/07/10')).toBe('2026-07-10'); expect(normalizeDate('2026.07.10')).toBe('2026-07-10') })
  it('拒絕負價格與負成交量，但允許法人負值', () => { const result = validateMarketRecord({ symbol: '2330', date: '1150710', price: '-1', volume: '-20', institutionalFlow: '-35.5', source: '測試來源', updatedAt: '2026-07-10' }); expect(result.valid).toBe(false); expect(result.errors).toEqual(expect.arrayContaining(['價格不可為負數', '成交量不可為負數'])); expect(result.normalized.institutionalFlow).toBe(-35.5) })
})
