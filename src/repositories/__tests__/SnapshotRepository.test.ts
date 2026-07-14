import { describe, expect, it } from 'vitest'
import { SnapshotStorage } from '../../services/snapshot/SnapshotStorage'
import { upsertSnapshotIndex } from '../../services/snapshot/SnapshotIndexService'
import type { MarketSnapshot, SnapshotIndex } from '../../types/snapshot'
import { SnapshotRepository } from '../SnapshotRepository'

const snapshot: MarketSnapshot = { schemaVersion: '1.0', snapshotId: 'twse-2026-07-13', tradeDate: '2026-07-13', generatedAt: '2026-07-14T04:53:38.458Z', market: 'TWSE', marketStatus: '偏強', marketTemperature: 72, confidence: 72, headline: '市場偏強', overview: { indexValue: 45380.52, change: 25.91, changePercent: .06, tradingAmount: 1067662107060, advanceCount: null, declineCount: null, unchangedCount: null }, topIndustries: [{ name: 'AI', changePercent: 3, capitalFlow: 80, momentum: 70, rank: 1, source: 'mock' }], weakIndustries: [{ name: '航運', changePercent: -2, capitalFlow: -50, momentum: -60, rank: 1, source: 'mock' }], risks: [], tags: ['偏強'], sources: [{ id: 'twse', name: 'TWSE', type: 'official', fields: ['overview'], tradeDate: '2026-07-13' }], warnings: [] }
const index: SnapshotIndex = { schemaVersion: '1.0', updatedAt: snapshot.generatedAt, snapshots: [{ tradeDate: snapshot.tradeDate, path: `data/history/${snapshot.tradeDate}.json`, marketStatus: snapshot.marketStatus, marketTemperature: snapshot.marketTemperature, headline: snapshot.headline }] }
const response = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } })

describe('SnapshotRepository', () => {
  it('Cache 可正常命中及清除', async () => { let calls = 0; const storage = new SnapshotStorage(async () => { calls += 1; return response(snapshot) }, '/guli/', 60_000); const repository = new SnapshotRepository(storage); await repository.getLatest(); await repository.getLatest(); expect(calls).toBe(1); repository.clearCache(); await repository.getLatest(); expect(calls).toBe(2) })
  it('不合法 schema 會被拒絕', async () => { const repository = new SnapshotRepository(new SnapshotStorage(async () => response({ ...snapshot, schemaVersion: '0.9' }), '/guli/')); await expect(repository.getLatest()).rejects.toMatchObject({ code: 'INVALID_SCHEMA' }) })
  it('空歷史 index 可正常處理', async () => { const empty: SnapshotIndex = { schemaVersion: '1.0', updatedAt: snapshot.generatedAt, snapshots: [] }; const repository = new SnapshotRepository(new SnapshotStorage(async () => response(empty), '/guli/')); await expect(repository.getAvailableDates()).resolves.toEqual([]) })
  it('同日期重跑不會新增重複 index 且維持新到舊', () => { const twice = upsertSnapshotIndex(upsertSnapshotIndex(index, snapshot), snapshot); expect(twice.snapshots).toHaveLength(1); expect(twice.snapshots[0].tradeDate).toBe('2026-07-13') })
  it('可透過 index 讀取實際存在的歷史 Snapshot', async () => { const storage = new SnapshotStorage(async (input) => String(input).endsWith('index.json') ? response(index) : response(snapshot), '/guli/'); const repository = new SnapshotRepository(storage); const history = await repository.getHistory(5); expect(history.map((item) => item.tradeDate)).toEqual(['2026-07-13']) })
})
