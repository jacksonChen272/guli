import { describe, expect, it } from 'vitest'
import { CachePolicy } from '../../cache/CachePolicy'
import { MemoryCache } from '../../cache/MemoryCache'
import { MarketRepository } from '../../repositories/MarketRepository'
import { TWSE_MARKET_ENDPOINTS, TWSE_SOURCE } from '../../services/twseMarketNormalization'
import type { OfficialMarketOverview, OfficialMarketRankingItem } from '../../types/marketData'
import { TWSEProvider } from '../TWSEProvider'

const ranking = (direction = 1): OfficialMarketRankingItem[] => Array.from({ length: 10 }, (_, index) => ({
  symbol: String(1101 + index), name: `測試股票 ${index + 1}`, close: 100 + index,
  change: direction * (index + 1), changePercent: direction * (index + 1),
  tradingAmount: (index + 1) * 100_000_000, tradingVolume: (index + 1) * 1_000_000,
}))

const official = (overrides: Partial<OfficialMarketOverview> = {}): OfficialMarketOverview => ({
  schemaVersion: '2.0', market: 'TWSE', tradeDate: '2026-07-15', indexName: '發行量加權股價指數', indexValue: 45631.59,
  change: 893.64, changePercent: 2, tradingAmount: 1_200_000_000_000, tradingVolume: 12_000_000_000, transactionCount: 6_000_000,
  advanceCount: 512, declineCount: 421, unchangedCount: 87, limitUpCount: 19, limitDownCount: 10, breadthSource: 'twtazu_od',
  tradingHistory: [{ tradeDate: '2026-07-15', indexValue: 45631.59, tradingAmount: 1_200_000_000_000, tradingVolume: 12_000_000_000, transactionCount: 6_000_000 }],
  rankings: { tradingAmount: ranking(), tradingVolume: ranking(), gainers: ranking(), losers: ranking(-1) },
  source: TWSE_SOURCE, sourceUrl: TWSE_MARKET_ENDPOINTS.join(' | '), fetchedAt: '2026-07-15T08:00:00.000Z', status: 'official', warnings: [], ...overrides,
})

describe('TWSEProvider market overview v2', () => {
  it('只讀取網站內的 v2 官方 JSON', async () => {
    let requestedUrl = ''
    const provider = new TWSEProvider(async (input) => { requestedUrl = String(input); return new Response(JSON.stringify(official()), { status: 200, headers: { 'content-type': 'application/json' } }) }, '/guli/')
    const result = await provider.getMarketOverview()
    expect(requestedUrl).toBe('/guli/data/twse-market-overview.json')
    expect(result.data).toMatchObject({ market: 'TWSE', indexValue: 45631.59, tradingVolume: 12_000_000_000 })
  })
  it('Provider 不因資訊警示把完整官方資料降級為 partial', async () => {
    const provider = new TWSEProvider(async () => new Response(JSON.stringify(official({ warnings: ['由官方日成交資料彙整'] })), { status: 200, headers: { 'content-type': 'application/json' } }), '/guli/')
    expect((await provider.getMarketOverview()).data).toMatchObject({ status: 'official' })
  })
  it('正式 JSON 不存在時 Repository fallback 且市場廣度與排行不填 Mock', async () => {
    const provider = new TWSEProvider(async () => new Response('', { status: 404 }), '/guli/')
    const repository = new MarketRepository(provider, new MemoryCache(), new CachePolicy())
    const result = await repository.read(undefined)
    expect(result.data.officialMarket?.status).toBe('fallback')
    expect(result.data.officialMarket?.advanceCount).toBeNull()
    expect(result.data.officialMarket?.rankings.tradingAmount).toEqual([])
  })
  it('Repository 不重複讀取同一份有效 Cache', async () => {
    let calls = 0
    const provider = new TWSEProvider(async () => { calls += 1; return new Response(JSON.stringify(official()), { status: 200, headers: { 'content-type': 'application/json' } }) }, '/guli/')
    const repository = new MarketRepository(provider, new MemoryCache(), new CachePolicy())
    await repository.read(undefined); await repository.read(undefined)
    expect(calls).toBe(1); expect(repository.getDiagnostics().cacheState).toBe('hit')
  })
  it('過期官方 JSON 回傳 stale 狀態', async () => {
    const provider = new TWSEProvider(async () => new Response(JSON.stringify(official({ tradeDate: '2026-01-02', tradingHistory: [{ ...official().tradingHistory[0], tradeDate: '2026-01-02' }] })), { status: 200, headers: { 'content-type': 'application/json' } }), '/guli/')
    expect((await provider.getMarketOverview()).status).toBe('stale')
  })
})
