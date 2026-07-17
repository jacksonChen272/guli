import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { TWSEStockHistoryProvider } from '../providers/TWSEStockHistoryProvider'
import { getHistoryRange as selectRange, getRecentHistory as selectRecent } from '../services/stockHistory/StockHistoryService'
import type { OfficialStockHistory } from '../types/officialStockHistory'

export class StockHistoryRepository {
  private readonly ownedKeys = new Set<string>()

  constructor(
    private readonly provider: TWSEStockHistoryProvider,
    private readonly cache: CacheStore,
    private readonly policy: CachePolicy,
  ) {}

  getAvailableSymbols() { return this.provider.getAvailableSymbols() }
  getDatasetStatus() { return this.provider.getDatasetStatus() }
  getTechnicalSnapshot() { return this.provider.getIndex().then((index) => index.summary) }
  getBackfillProgress() { return this.provider.getBackfillProgress() }
  getResolvedUrl(symbol: string) { return this.provider.getResolvedHistoryUrl(symbol) }

  async getHistory(symbol: string, force = false): Promise<OfficialStockHistory> {
    const key = `stock-history:${symbol}`
    this.ownedKeys.add(key)
    if (!force) {
      const cached = this.cache.get<OfficialStockHistory>(key)
      if (cached.entry && cached.state === 'hit') return cached.entry.value
    }
    const dataset = await this.provider.getHistory(symbol)
    this.cache.set(key, dataset, this.policy.getTtl('stock-history'), dataset.source)
    return dataset
  }

  async getRecentHistory(symbol: string, tradingDays: number) {
    return selectRecent(await this.getHistory(symbol), tradingDays)
  }

  async getHistoryRange(symbol: string, startDate: string, endDate: string) {
    return selectRange(await this.getHistory(symbol), startDate, endDate)
  }

  async refresh(symbol?: string) {
    this.clearCache(symbol)
    return symbol ? this.getHistory(symbol, true) : this.provider.getIndex()
  }

  clearCache(symbol?: string) {
    this.provider.clearCache(symbol)
    if (symbol) {
      const key = `stock-history:${symbol}`
      this.cache.delete(key)
      this.ownedKeys.delete(key)
      return
    }
    this.ownedKeys.forEach((key) => this.cache.delete(key))
    this.ownedKeys.clear()
  }
}
