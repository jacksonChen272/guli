import { describe, expect, it } from 'vitest'
import { CachePolicy } from '../../cache/CachePolicy'
import { MemoryCache } from '../../cache/MemoryCache'
import { MarketRepository } from '../../repositories/MarketRepository'
import type { OfficialMarketOverview } from '../../types/marketData'
import { TWSE_SOURCE, TWSE_MARKET_ENDPOINTS } from '../../services/twseMarketNormalization'
import { TWSEProvider } from '../TWSEProvider'

const official = (overrides: Partial<OfficialMarketOverview> = {}): OfficialMarketOverview => ({
  market: 'TWSE', tradeDate: '2026-07-13', indexName: '發行量加權股價指數', indexValue: 45380.52,
  change: 25.91, changePercent: 0.06, tradingAmount: 1067662107060, advanceCount: 512,
  declineCount: 421, unchangedCount: 87, source: TWSE_SOURCE, sourceUrl: TWSE_MARKET_ENDPOINTS.join(' | '),
  fetchedAt: '2026-07-13T08:00:00.000Z', status: 'official', warnings: [], ...overrides,
})

describe('TWSEProvider', () => {
  it('可讀取有效的網站內官方 JSON', async () => {
    const provider = new TWSEProvider(async () => new Response(JSON.stringify(official()), { status: 200, headers: { 'content-type': 'application/json' } }), '/guli/')
    const result = await provider.getMarketOverview()
    expect(result.data).toMatchObject({ market: 'TWSE', indexValue: 45380.52 })
  })
  it('正式 JSON 不存在時 Repository 會 fallback，且不白畫面', async () => {
    const provider = new TWSEProvider(async () => new Response('', { status: 404 }), '/guli/')
    const repository = new MarketRepository(provider, new MemoryCache(), new CachePolicy())
    const result = await repository.read(undefined)
    expect(result.data.officialMarket?.status).toBe('fallback')
    expect(result.data.indices[0].value).toBeGreaterThan(0)
  })
  it('Repository 不會重複讀取同一份有效 Cache', async () => {
    let calls = 0
    const provider = new TWSEProvider(async () => { calls += 1; return new Response(JSON.stringify(official()), { status: 200, headers: { 'content-type': 'application/json' } }) }, '/guli/')
    const repository = new MarketRepository(provider, new MemoryCache(), new CachePolicy())
    await repository.read(undefined); await repository.read(undefined)
    expect(calls).toBe(1); expect(repository.getDiagnostics().cacheState).toBe('hit')
  })
  it('過期官方 JSON 會回傳 stale 狀態', async () => {
    const provider = new TWSEProvider(async () => new Response(JSON.stringify(official({ tradeDate: '2026-01-02' })), { status: 200, headers: { 'content-type': 'application/json' } }), '/guli/')
    expect((await provider.getMarketOverview()).status).toBe('stale')
  })
})
