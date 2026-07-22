import { describe, expect, it } from 'vitest'
import { validateHistoryCoverage } from '../../../../scripts/data/history/HistoryAutomation.ts'

const baseline = { totalSecurities: 1370, eligibleCommonStocks: 1082, unsupportedSecurities: 288, complete: 121, partial: 76, pending: 885, failed: 0, technicalDataReady: 197 }

describe('history coverage invariants', () => {
  it('accepts the verified Phase 2 denominator', () => expect(validateHistoryCoverage(baseline)).toEqual({ valid: true, errors: [] }))
  it('rejects unsupported securities counted in the eligible denominator', () => expect(validateHistoryCoverage({ ...baseline, eligibleCommonStocks: 1370 }).valid).toBe(false))
  it('rejects technical readiness above complete plus partial', () => expect(validateHistoryCoverage({ ...baseline, technicalDataReady: 198 }).valid).toBe(false))
})
