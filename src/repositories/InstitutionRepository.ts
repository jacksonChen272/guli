import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import type { GuliDataProvider } from '../providers/ProviderTypes'
import type { InstitutionalTradeRecord } from '../types/api'
import { BaseRepository } from './BaseRepository'

export class InstitutionRepository extends BaseRepository<InstitutionalTradeRecord[], string> {
  constructor(private readonly provider: GuliDataProvider, cache: CacheStore, policy: CachePolicy) { super('institutions', 'institutions', cache, policy) }
  protected fetch(date: string) { return this.provider.getInstitutionalTrades(date) }
}
