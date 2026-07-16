import { describe, expect, it } from 'vitest'
import { MockProvider } from '../../../providers/MockProvider'
import type { OfficialMarketOverview } from '../../../types/marketData'
import { formatShareSummary } from '../SnapshotFormatter'
import { SnapshotGenerator } from '../SnapshotGenerator'
import { validateMarketSnapshot } from '../../snapshotValidationService'

const official: OfficialMarketOverview = { schemaVersion: '2.0', market: 'TWSE', tradeDate: '2026-07-13', indexName: '發行量加權股價指數', indexValue: 45380.52, change: 25.91, changePercent: .06, tradingAmount: 1067662107060, tradingVolume: 10_000_000_000, transactionCount: 5_000_000, advanceCount: null, declineCount: null, unchangedCount: null, limitUpCount: null, limitDownCount: null, breadthSource: 'stock_day_all', tradingHistory: [{ tradeDate: '2026-07-13', indexValue: 45380.52, tradingAmount: 1067662107060, tradingVolume: 10_000_000_000, transactionCount: 5_000_000 }], rankings: { tradingAmount: [], tradingVolume: [], gainers: [], losers: [] }, source: '臺灣證券交易所（TWSE）', sourceUrl: 'https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX', fetchedAt: '2026-07-14T04:53:38.458Z', status: 'partial', warnings: ['市場廣度不完整'] }
const input = () => { const source = new MockProvider().getSnapshot(); return { overview: { ...source.overview, officialMarket: official }, industries: source.industries, headline: '市場偏強，資金集中於 AI 與 PCB。' } }
describe('SnapshotGenerator', () => {
  it('相同輸入產生相同核心 Snapshot', () => { const generator = new SnapshotGenerator(); expect(generator.generate(input())).toEqual(generator.generate(input())) })
  it('市場溫度一定介於 0–100', () => { const data = input(); data.overview.temperature = { ...data.overview.temperature, score: 150 }; expect(new SnapshotGenerator().generate(data).marketTemperature).toBe(100) })
  it('缺少官方指數時使用 null 而非假數值', () => { const data = input(); delete data.overview.officialMarket; expect(new SnapshotGenerator().generate(data).overview.indexValue).toBeNull() })
  it('部分 Mock 資料會正確標示來源', () => { const snapshot = new SnapshotGenerator().generate(input()); expect(snapshot.sources.map((source) => source.type)).toEqual(expect.arrayContaining(['official', 'mock', 'derived'])) })
  it('同一產業不會同時列入強弱榜', () => { const snapshot = new SnapshotGenerator().generate(input()); expect(snapshot.topIndustries.some((top) => snapshot.weakIndustries.some((weak) => weak.name === top.name))).toBe(false) })
  it('驗證層拒絕同一產業同時列入強弱榜', () => { const snapshot = new SnapshotGenerator().generate(input()); snapshot.weakIndustries[0] = { ...snapshot.topIndustries[0] }; expect(validateMarketSnapshot(snapshot).valid).toBe(false) })
  it('分享摘要包含來源與免責聲明', () => { const summary = formatShareSummary(new SnapshotGenerator().generate(input())); expect(summary).toContain('資料來源'); expect(summary).toContain('不構成投資建議') })
})
