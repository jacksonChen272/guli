import { describe, expect, it } from 'vitest'
import type { MarketSnapshot } from '../../../types/snapshot'
import { SnapshotDiffService } from '../SnapshotDiffService'
const snapshot = (date: string, temperature: number, status: MarketSnapshot['marketStatus'], top = ['AI']): MarketSnapshot => ({ schemaVersion: '1.0', snapshotId: date, tradeDate: date, generatedAt: `${date}T08:00:00.000Z`, market: 'TWSE', marketStatus: status, marketTemperature: temperature, confidence: 80, headline: '摘要', overview: { indexValue: 100 + temperature, change: 1, changePercent: 1, tradingAmount: 1000, advanceCount: null, declineCount: null, unchangedCount: null }, topIndustries: top.map((name, index) => ({ name, changePercent: 1, capitalFlow: 1, momentum: 1, rank: index + 1, source: 'mock' })), weakIndustries: [{ name: '航運', changePercent: -1, capitalFlow: -1, momentum: -1, rank: 1, source: 'mock' }], risks: [], tags: [], sources: [{ id: 'official', name: 'TWSE', type: 'official', fields: ['overview'], tradeDate: date }], warnings: [] })
describe('SnapshotDiffService', () => {
  it('正確計算溫度增加及下降', () => { const service = new SnapshotDiffService(); expect(service.compare(snapshot('2026-07-14', 70, '偏強'), snapshot('2026-07-13', 60, '中性')).temperature.change).toBe(10); expect(service.compare(snapshot('2026-07-14', 50, '中性'), snapshot('2026-07-13', 60, '中性')).temperature.change).toBe(-10) })
  it('可偵測市場狀態改變', () => expect(new SnapshotDiffService().compare(snapshot('2026-07-14', 70, '偏強'), snapshot('2026-07-13', 50, '中性')).marketStatusChanged).toBe(true))
  it('可偵測強勢產業新進及退出', () => { const diff = new SnapshotDiffService().compare(snapshot('2026-07-14', 70, '偏強', ['PCB']), snapshot('2026-07-13', 60, '中性', ['AI'])); expect(diff.addedTopIndustries).toEqual(['PCB']); expect(diff.removedTopIndustries).toEqual(['AI']) })
  it('只有一份 Snapshot 時回傳無前期資料', () => expect(new SnapshotDiffService().compare(snapshot('2026-07-13', 70, '偏強')).hasPrevious).toBe(false))
})
