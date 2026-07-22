import { describe, expect, it } from 'vitest'
import { calculateHistoryProgress } from '../../../../scripts/data/history/HistoryAutomation.ts'

describe('history progress summary', () => {
  it('calculates complete and technical percentages from eligible common stocks', () => {
    const result = calculateHistoryProgress({ totalSecurities: 1370, eligibleCommonStocks: 1082, unsupportedSecurities: 288, complete: 121, partial: 76, pending: 885, failed: 0, technicalDataReady: 197 })
    expect(result.completionPercent).toBe(11.2)
    expect(result.analyzablePercent).toBe(18.2)
  })

  it('estimates one bounded batch per remaining day', () => {
    const result = calculateHistoryProgress({ totalSecurities: 200, eligibleCommonStocks: 180, unsupportedSecurities: 20, complete: 0, partial: 0, pending: 180, failed: 0, technicalDataReady: 0 })
    expect(result.remainingBatches).toBe(2)
    expect(result.estimatedCompletionDays).toBe(2)
  })
})
