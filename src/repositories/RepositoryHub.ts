import { CachePolicy } from '../cache/CachePolicy'
import { MemoryCache } from '../cache/MemoryCache'
import { providerFactory } from '../providers/ProviderFactory'
import { MockProvider } from '../providers/MockProvider'
import type { ProviderId } from '../providers/ProviderTypes'
import { MOCK_DATA_SOURCE, MOCK_UPDATED_AT } from '../services/mockDataProvider'
import { dataQuality } from '../services/DataQuality'
import { marketSession } from '../services/MarketSession'
import { refreshScheduler } from '../services/RefreshScheduler'
import { IndustryRepository } from './IndustryRepository'
import { InstitutionRepository } from './InstitutionRepository'
import { MarketRepository } from './MarketRepository'
import { StockRepository } from './StockRepository'
import { WatchlistRepository } from './WatchlistRepository'
import { SnapshotRepository } from './SnapshotRepository'
import { IndustrySnapshotRepository } from './IndustrySnapshotRepository'
import { StockSnapshotRepository } from './StockSnapshotRepository'
import { DecisionRepository } from './DecisionRepository'

export class RepositoryHub {
  private cache = new MemoryCache()
  private readonly policy = new CachePolicy()
  market!: MarketRepository
  stocks!: StockRepository
  industries!: IndustryRepository
  institutions!: InstitutionRepository
  watchlist!: WatchlistRepository
  readonly snapshots = new SnapshotRepository()
  readonly industrySnapshots = new IndustrySnapshotRepository()
  readonly stockSnapshots = new StockSnapshotRepository()
  decisions!: DecisionRepository

  constructor() { this.rebuild(); this.registerRefreshTasks() }
  private rebuild() {
    const provider = providerFactory.getActive()
    const mockProvider = provider instanceof MockProvider ? provider : new MockProvider()
    this.cache = new MemoryCache()
    this.market = new MarketRepository(provider, this.cache, this.policy)
    this.stocks = new StockRepository(mockProvider, this.cache, this.policy)
    this.industries = new IndustryRepository(mockProvider, this.cache, this.policy)
    this.institutions = new InstitutionRepository(mockProvider, this.cache, this.policy)
    this.watchlist = new WatchlistRepository(this.cache, this.policy)
    this.decisions = new DecisionRepository(this.snapshots, this.industrySnapshots, this.stockSnapshots, this.stocks)
  }
  private registerRefreshTasks() {
    refreshScheduler.register({ id: 'market-overview', intervalMs: this.policy.getTtl('market'), run: async () => { await this.market.refresh(undefined) } })
    refreshScheduler.register({ id: 'stocks', intervalMs: this.policy.getTtl('stocks'), run: async () => { await this.stocks.refresh(undefined) } })
    refreshScheduler.register({ id: 'industries', intervalMs: this.policy.getTtl('industries'), run: async () => { await this.industries.refresh(undefined) } })
  }
  selectProvider(id: ProviderId) { const changed = providerFactory.select(id); if (changed) this.rebuild(); return changed }
  refreshMarket() { return this.market.refresh(undefined) }
  getProvider() { return providerFactory.getActive() }
  getSnapshot() { return this.market.getSnapshot() }
  getMetadata() { const official = this.getSnapshot().overview.officialMarket; return { source: official?.source ?? MOCK_DATA_SOURCE, updatedAt: official?.fetchedAt ?? MOCK_UPDATED_AT, isMock: !official || official.status === 'fallback', status: official?.status ?? 'fallback', warning: official?.warnings[0] ?? '目前為模擬資料，尚未接入即時或盤後市場資料。' } }
  getPlatformStatus() {
    const snapshot = this.getSnapshot()
    return {
      provider: this.getProvider().descriptor,
      updatedAt: snapshot.overview.officialMarket?.fetchedAt ?? MOCK_UPDATED_AT,
      cache: this.market.getDiagnostics().cacheState,
      quality: snapshot.overview.officialMarket ? dataQuality.evaluateOfficial(snapshot.overview.officialMarket) : dataQuality.evaluate(snapshot.stocks, snapshot.overview),
      official: snapshot.overview.officialMarket,
      fallbackReason: this.market.getFallbackReason(),
      session: marketSession.getSession(),
      scheduler: refreshScheduler.list(),
    }
  }
}

export const repositoryHub = new RepositoryHub()
