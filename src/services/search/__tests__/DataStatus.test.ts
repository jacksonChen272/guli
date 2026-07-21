import { describe, expect, it } from 'vitest'
import { availability, calculateSearchCoverage, displayNumber, finiteOrNull, scoreStatus } from '../DataStatusService'

describe('DataStatusService', () => {
  it('拒絕 NaN 與無限數值', () => { expect(finiteOrNull(Number.NaN)).toBeNull(); expect(finiteOrNull(Number.POSITIVE_INFINITY)).toBeNull() })
  it('已取得分數顯示 available', () => expect(scoreStatus(89, true)).toEqual({ value: 89, state: 'available' }))
  it('預期取得但尚未完成顯示 waiting', () => expect(scoreStatus(null, true)).toEqual({ value: null, state: 'waiting' }))
  it('不在覆蓋範圍顯示 missing', () => expect(scoreStatus(undefined, false)).toEqual({ value: null, state: 'missing' }))
  it('官方行情可用狀態正確', () => expect(availability(true, false)).toBe('available'))
  it('覆蓋數量與百分比由輸入即時計算', () => { const result = calculateSearchCoverage({ totalStocks: 1082, officialStocks: 1082, historyStocks: 94, technicalStocks: 94, decisionStocks: 1082, snapshotStocks: 1082, updatedAt: '2026-07-20T00:00:00Z' }); expect(result.officialPercent).toBe(100); expect(result.historyPercent).toBe(8.7); expect(result.decisionStocks).toBe(1082) })
  it('UI 格式化不輸出 null、undefined 或 NaN', () => { expect(displayNumber(null, String)).toBe('等待資料'); expect(displayNumber(Number.NaN, String)).toBe('等待資料') })
})
