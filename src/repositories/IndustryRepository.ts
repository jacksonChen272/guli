import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { MockProvider } from '../providers/MockProvider'
import type { GuliDataProvider } from '../providers/ProviderTypes'
import type { Industry } from '../types/industry'
import { BaseRepository } from './BaseRepository'

export class IndustryRepository extends BaseRepository<Industry[], void> {
  constructor(private readonly provider: GuliDataProvider, cache: CacheStore, policy: CachePolicy) { super('industries', 'industries', cache, policy) }
  protected fetch() { return this.provider.getIndustryData() }
  getSnapshot() { if (this.provider instanceof MockProvider) return this.provider.getSnapshot().industries; throw new Error('目前 Provider 不支援同步快照') }
}
