import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { MockProvider } from '../providers/MockProvider'
import type { GuliDataProvider } from '../providers/ProviderTypes'
import type { Stock } from '../types/stock'
import { BaseRepository } from './BaseRepository'

export class StockRepository extends BaseRepository<Stock[], void> {
  constructor(private readonly provider: GuliDataProvider, cache: CacheStore, policy: CachePolicy) { super('stocks', 'stocks', cache, policy) }
  protected fetch() { return this.provider.getStocks() }
  getBySymbol(symbol: string) { return this.provider.getStockDetail(symbol) }
  getSnapshot() { if (this.provider instanceof MockProvider) return this.provider.getSnapshot().stocks; throw new Error('目前 Provider 不支援同步快照') }
}
