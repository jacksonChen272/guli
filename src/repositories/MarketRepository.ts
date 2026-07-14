import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { MockProvider } from '../providers/MockProvider'
import type { GuliDataProvider } from '../providers/ProviderTypes'
import { toHundredMillionTWD } from '../services/twseMarketNormalization'
import type { DataResult, MarketOverviewData } from '../types/api'
import { isOfficialMarketOverview, type OfficialMarketOverview } from '../types/marketData'
import { BaseRepository } from './BaseRepository'

const fallbackProvider = new MockProvider()

const mergeOfficialOverview = (official: OfficialMarketOverview, mock: MarketOverviewData): MarketOverviewData => {
  const officialSource = official.status === 'official' ? 'official' : official.status === 'partial' ? 'partial' : 'fallback'
  const taiex = mock.indices[0]
  const officialTrend = [...taiex.trend.filter((point) => point.date !== official.tradeDate), { date: official.tradeDate, value: official.indexValue }].slice(-20)
  return {
    ...mock,
    indices: [{ ...taiex, value: official.indexValue, change: official.change, changePercent: official.changePercent, previousValue: official.indexValue - official.change, trend: officialTrend }, ...mock.indices.slice(1)],
    tradingAmount: { ...mock.tradingAmount, value: toHundredMillionTWD(official.tradingAmount) },
    officialMarket: official,
    fieldSources: { taiex: officialSource, tradingAmount: official.status === 'fallback' ? 'fallback' : 'partial', marketBreadth: officialSource, institutions: 'mock' },
  }
}

export class MarketRepository extends BaseRepository<MarketOverviewData, void> {
  private latestOverview: MarketOverviewData = fallbackProvider.getSnapshot().overview
  private fallbackReason?: string
  constructor(private readonly provider: GuliDataProvider, cache: CacheStore, policy: CachePolicy) { super('market', 'market', cache, policy) }
  protected async fetch(): Promise<DataResult<MarketOverviewData>> {
    try {
      const result = await this.provider.getMarketOverview()
      if (isOfficialMarketOverview(result.data)) {
        this.latestOverview = mergeOfficialOverview(result.data, fallbackProvider.getSnapshot().overview)
        this.fallbackReason = undefined
        return { ...result, data: this.latestOverview }
      }
      this.latestOverview = result.data
      this.fallbackReason = undefined
      return { ...result, data: this.latestOverview }
    } catch (error) {
      const mockResult = await fallbackProvider.getMarketOverview()
      const reason = error instanceof Error ? error.message : '未知資料錯誤'
      this.fallbackReason = reason
      const mock = mockResult.data
      const taiex = mock.indices[0]
      const fallback: OfficialMarketOverview = {
        market: 'TWSE', tradeDate: taiex.trend.at(-1)?.date ?? mockResult.updatedAt.slice(0, 10), indexName: taiex.name,
        indexValue: taiex.value, change: taiex.change, changePercent: taiex.changePercent,
        tradingAmount: mock.tradingAmount.value * 100_000_000, advanceCount: null, declineCount: null, unchangedCount: null,
        source: mockResult.source, fetchedAt: mockResult.updatedAt, status: 'fallback', warnings: [`TWSE 靜態 JSON 讀取失敗，已回退模擬資料：${reason}`],
      }
      this.latestOverview = mergeOfficialOverview(fallback, mock)
      return { data: this.latestOverview, source: mockResult.source, updatedAt: mockResult.updatedAt, status: 'stale', warnings: fallback.warnings }
    }
  }
  getEvents() { return fallbackProvider.getMarketEvents() }
  getSnapshot(): Omit<ReturnType<MockProvider['getSnapshot']>, 'overview'> & { overview: MarketOverviewData } { return { ...fallbackProvider.getSnapshot(), overview: this.latestOverview } }
  getFallbackReason() { return this.fallbackReason }
}
