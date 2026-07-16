import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { MockProvider } from '../providers/MockProvider'
import type { GuliDataProvider } from '../providers/ProviderTypes'
import { toHundredMillionTWD } from '../services/twseMarketNormalization'
import type { DataResult, MarketOverviewData } from '../types/api'
import { isOfficialMarketOverview, type OfficialMarketOverview } from '../types/marketData'
import { BaseRepository } from './BaseRepository'

const fallbackProvider = new MockProvider()

const percentageChange = (current: number, previous: number) => previous === 0 ? 0 : (current - previous) / previous * 100

const mergeOfficialOverview = (official: OfficialMarketOverview, mock: MarketOverviewData): MarketOverviewData => {
  const officialSource = official.status === 'official' ? 'official' : official.status === 'partial' ? 'partial' : 'fallback'
  const taiex = mock.indices[0]
  const tradingHistory = official.tradingHistory
  const latestTradingIndex = tradingHistory.findIndex((point) => point.tradeDate === official.tradeDate)
  const previousTrading = latestTradingIndex > 0 ? tradingHistory[latestTradingIndex - 1] : undefined
  const currentAmount = toHundredMillionTWD(official.tradingAmount)
  const previousAmount = previousTrading ? toHundredMillionTWD(previousTrading.tradingAmount) : currentAmount
  return {
    ...mock,
    indices: [{
      ...taiex,
      value: official.indexValue,
      change: official.change,
      changePercent: official.changePercent,
      previousValue: official.indexValue - official.change,
      trend: tradingHistory.map((point) => ({ date: point.tradeDate, value: point.indexValue })),
    }, ...mock.indices.slice(1)],
    tradingAmount: {
      value: currentAmount,
      change: currentAmount - previousAmount,
      changePercent: percentageChange(currentAmount, previousAmount),
      previousValue: previousAmount,
      trend: tradingHistory.map((point) => ({ date: point.tradeDate, value: toHundredMillionTWD(point.tradingAmount) })),
    },
    officialMarket: official,
    fieldSources: { taiex: officialSource, tradingAmount: officialSource, marketBreadth: officialSource, institutions: 'mock' },
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
      const tradeDate = taiex.trend.at(-1)?.date ?? mockResult.updatedAt.slice(0, 10)
      const fallback: OfficialMarketOverview = {
        schemaVersion: '2.0', market: 'TWSE', tradeDate, indexName: taiex.name,
        indexValue: taiex.value, change: taiex.change, changePercent: taiex.changePercent,
        tradingAmount: mock.tradingAmount.value * 100_000_000, tradingVolume: 0, transactionCount: 0,
        advanceCount: null, declineCount: null, unchangedCount: null, limitUpCount: null, limitDownCount: null,
        breadthSource: 'stock_day_all',
        tradingHistory: [{ tradeDate, indexValue: taiex.value, tradingAmount: mock.tradingAmount.value * 100_000_000, tradingVolume: 0, transactionCount: 0 }],
        rankings: { tradingAmount: [], tradingVolume: [], gainers: [], losers: [] },
        source: mockResult.source, fetchedAt: mockResult.updatedAt, status: 'fallback',
        warnings: [`TWSE 靜態 JSON 讀取失敗；市場廣度與排行不使用 Mock，已保留為無資料：${reason}`],
      }
      this.latestOverview = mergeOfficialOverview(fallback, mock)
      return { data: this.latestOverview, source: mockResult.source, updatedAt: mockResult.updatedAt, status: 'stale', warnings: fallback.warnings }
    }
  }
  getEvents() { return fallbackProvider.getMarketEvents() }
  getSnapshot(): Omit<ReturnType<MockProvider['getSnapshot']>, 'overview'> & { overview: MarketOverviewData } { return { ...fallbackProvider.getSnapshot(), overview: this.latestOverview } }
  getFallbackReason() { return this.fallbackReason }
}
