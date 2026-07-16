import { beforeEach, describe, expect, it } from 'vitest'
import { CachePolicy } from '../../cache/CachePolicy'
import { LocalStorageCache, type StorageLike } from '../../cache/LocalStorageCache'
import { MemoryCache } from '../../cache/MemoryCache'
import { TWSEProvider } from '../../providers/TWSEProvider'
import { MockProvider } from '../../providers/MockProvider'
import { ProviderFactory } from '../../providers/ProviderFactory'
import { DataQuality } from '../../services/DataQuality'
import { MarketSession } from '../../services/MarketSession'
import { RefreshScheduler } from '../../services/RefreshScheduler'
import { IndustryRepository } from '../IndustryRepository'
import { InstitutionRepository } from '../InstitutionRepository'
import { MarketRepository } from '../MarketRepository'
import { StockRepository } from '../StockRepository'
import { WatchlistRepository } from '../WatchlistRepository'

class TestStorage implements StorageLike {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  clear() { this.values.clear() }
}

describe('GULI repositories', () => {
  let provider: MockProvider
  let cache: MemoryCache
  let policy: CachePolicy

  beforeEach(() => { provider = new MockProvider(); cache = new MemoryCache(); policy = new CachePolicy({ market: 100 }) })

  it('MarketRepository 先讀 Provider，再命中 MemoryCache', async () => {
    const repository = new MarketRepository(provider, cache, policy)
    const first = await repository.read(undefined)
    expect(first.data.indices).toHaveLength(2)
    expect(repository.getDiagnostics().cacheState).toBe('miss')
    await repository.read(undefined)
    expect(repository.getDiagnostics().cacheState).toBe('hit')
  })

  it('force refresh 會更新 Repository cache', async () => {
    const repository = new MarketRepository(provider, cache, policy)
    await repository.read(undefined)
    await repository.refresh(undefined)
    expect(repository.getDiagnostics().cacheState).toBe('miss')
    expect(cache.size()).toBe(1)
  })

  it('StockRepository 提供完整股票與代號查詢', async () => {
    const repository = new StockRepository(provider, cache, policy)
    const stocks = await repository.read(undefined)
    const detail = await repository.getBySymbol('2330')
    expect(stocks.data.length).toBeGreaterThanOrEqual(30)
    expect(detail.data?.name).toBe('台積電')
  })

  it('IndustryRepository 提供 12 個以上產業', async () => {
    const repository = new IndustryRepository(provider, cache, policy)
    expect((await repository.read(undefined)).data.length).toBeGreaterThanOrEqual(12)
  })

  it('InstitutionRepository 依日期回傳法人資料', async () => {
    const repository = new InstitutionRepository(provider, cache, policy)
    const date = provider.getSnapshot().tradingDates.at(-1) ?? '2026-07-11'
    const records = await repository.read(date)
    expect(records.data.length).toBeGreaterThanOrEqual(30)
    expect(records.data.every((record) => record.date === date)).toBe(true)
  })

  it('WatchlistRepository 經 store 讀取預設自選股', async () => {
    const repository = new WatchlistRepository(cache, policy)
    const result = await repository.read(undefined)
    expect(result.data.map((item) => item.symbol)).toEqual(expect.arrayContaining(['2330', '2313', '3006']))
  })
})

describe('Provider、Cache 與平台服務', () => {
  it('ProviderFactory 允許 Mock 與 TWSE，其他未來 Provider 保持停用', () => {
    const factory = new ProviderFactory()
    expect(factory.getActiveId()).toBe('twse')
    expect(factory.select('twse')).toBe(true)
    expect(factory.create('twse')).toBeInstanceOf(TWSEProvider)
    expect(factory.select('finmind')).toBe(false)
  })

  it('LocalStorageCache 可持久化、辨識過期並只清除自身 namespace', () => {
    const storage = new TestStorage()
    storage.setItem('other:key', 'keep')
    const cache = new LocalStorageCache('test:', storage)
    cache.set('market', { value: 1 }, 100, 'test', 1_000)
    expect(cache.get<{ value: number }>('market', 1_050).state).toBe('hit')
    expect(cache.get('market', 1_101).state).toBe('stale')
    cache.clear()
    expect(storage.getItem('other:key')).toBe('keep')
  })

  it('DataQuality 對完整 mock data 給予可接受品質', () => {
    const snapshot = new MockProvider().getSnapshot()
    const report = new DataQuality().evaluate(snapshot.stocks, snapshot.overview)
    expect(report.score).toBeGreaterThanOrEqual(80)
    expect(report.issues).toHaveLength(0)
  })

  it('MarketSession 可辨識台北交易時段與週末', () => {
    const session = new MarketSession()
    expect(session.getSession(new Date('2026-07-13T02:00:00Z')).state).toBe('open')
    expect(session.getSession(new Date('2026-07-12T02:00:00Z')).state).toBe('weekend')
  })

  it('RefreshScheduler 可手動刷新且記錄時間', async () => {
    const scheduler = new RefreshScheduler()
    let count = 0
    scheduler.register({ id: 'market', intervalMs: 60_000, run: async () => { count += 1 } })
    expect(await scheduler.refreshNow('market')).toBe(true)
    expect(count).toBe(1)
    expect(scheduler.list()[0].lastRunAt).toBeTruthy()
  })
})
