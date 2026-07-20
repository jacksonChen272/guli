import { CachePolicy } from '../cache/CachePolicy'
import { MemoryCache } from '../cache/MemoryCache'
import { providerFactory } from '../providers/ProviderFactory'
import { MockProvider } from '../providers/MockProvider'
import type { ProviderId } from '../providers/ProviderTypes'
import { dataQuality } from '../services/DataQuality'
import { marketSession } from '../services/MarketSession'
import { MOCK_DATA_SOURCE, MOCK_UPDATED_AT } from '../services/mockDataProvider'
import { refreshScheduler } from '../services/RefreshScheduler'
import type {
  DataPlatformStatus,
  IndustryPlatformState,
  OfficialDatasetPlatformState,
} from '../types/dataPlatformStatus'
import { DecisionRepository } from './DecisionRepository'
import { IndustryRepository } from './IndustryRepository'
import { IndustryMappingRepository } from './IndustryMappingRepository'
import { IndustrySnapshotRepository } from './IndustrySnapshotRepository'
import { InstitutionRepository } from './InstitutionRepository'
import { MarketRepository } from './MarketRepository'
import { MarketHeatmapRepository } from './MarketHeatmapRepository'
import { SnapshotRepository } from './SnapshotRepository'
import { StockRepository } from './StockRepository'
import { StockHistoryRepository } from './StockHistoryRepository'
import { ScreenerRepository } from './ScreenerRepository'
import { StockSnapshotRepository } from './StockSnapshotRepository'
import { TWSEStockHistoryProvider } from '../providers/TWSEStockHistoryProvider'
import { WatchlistDashboardRepository } from './WatchlistDashboardRepository'
import { WatchlistRepository } from './WatchlistRepository'

const mapOfficialDatasetState = (
  available: boolean,
  status: string,
  stale: boolean,
): OfficialDatasetPlatformState => {
  if (!available || status === 'missing' || status === 'invalid') return 'Missing'
  if (status === 'official' && !stale) return 'Official'
  return 'Partial'
}

export class RepositoryHub {
  private cache = new MemoryCache()
  private readonly policy = new CachePolicy()
  market!: MarketRepository
  stocks!: StockRepository
  stockHistory!: StockHistoryRepository
  readonly screener = new ScreenerRepository()
  readonly marketHeatmap = new MarketHeatmapRepository()
  readonly industryMapping = new IndustryMappingRepository()
  industries!: IndustryRepository
  institutions!: InstitutionRepository
  watchlist!: WatchlistRepository
  readonly snapshots = new SnapshotRepository()
  readonly industrySnapshots = new IndustrySnapshotRepository()
  readonly stockSnapshots = new StockSnapshotRepository()
  decisions!: DecisionRepository
  watchlistDashboard!: WatchlistDashboardRepository

  constructor() {
    this.rebuild()
    this.registerRefreshTasks()
  }

  private rebuild() {
    const provider = providerFactory.getActive()
    const mockProvider = provider instanceof MockProvider ? provider : new MockProvider()
    this.cache = new MemoryCache()
    this.market = new MarketRepository(provider, this.cache, this.policy)
    this.stocks = new StockRepository(mockProvider, this.cache, this.policy)
    this.stockHistory = new StockHistoryRepository(new TWSEStockHistoryProvider(), this.cache, this.policy)
    this.industries = new IndustryRepository(mockProvider, this.cache, this.policy)
    this.institutions = new InstitutionRepository(this.cache, this.policy)
    this.watchlist = new WatchlistRepository(this.cache, this.policy)
    this.decisions = new DecisionRepository(
      this.snapshots,
      this.industrySnapshots,
      this.stockSnapshots,
      this.stocks,
      this.institutions,
    )
    this.watchlistDashboard = new WatchlistDashboardRepository({
      getWatchlist: () => this.watchlist.getSnapshot(),
      getStocks: () => this.stocks.getSnapshot(),
      getMarketDecision: () => this.decisions.getMarketDecision(),
      getStockDecision: (symbol, date) => this.decisions.getStockDecision(symbol, date),
      getStockComparison: (symbol, currentDate) => this.decisions.getDecisionComparison('stock', symbol, currentDate),
      getSnapshotIndex: () => this.stockSnapshots.getLatestIndex(),
      getStockSnapshot: (symbol, date) => this.stockSnapshots.getBySymbol(symbol, date),
      getStockDiff: (symbol, currentDate) => this.stockSnapshots.getDiff(symbol, currentDate),
      getIndustrySnapshot: () => this.industrySnapshots.getLatest(),
      getIndustryDecision: (industryId) => this.decisions.getIndustryDecision(industryId),
    })
  }

  private registerRefreshTasks() {
    refreshScheduler.register({
      id: 'market-overview',
      intervalMs: this.policy.getTtl('market'),
      run: async () => { await this.market.refresh(undefined) },
    })
    refreshScheduler.register({
      id: 'stocks',
      intervalMs: this.policy.getTtl('stocks'),
      run: async () => { await this.stocks.refresh(undefined) },
    })
    refreshScheduler.register({
      id: 'industries',
      intervalMs: this.policy.getTtl('industries'),
      run: async () => { await this.industries.refresh(undefined) },
    })
    refreshScheduler.register({
      id: 'institutions',
      intervalMs: this.policy.getTtl('institutions'),
      run: async () => { await this.institutions.refresh() },
    })
  }

  selectProvider(id: ProviderId) {
    const changed = providerFactory.select(id)
    if (changed) this.rebuild()
    return changed
  }

  refreshMarket() { return this.market.refresh(undefined) }
  getProvider() { return providerFactory.getActive() }
  getSnapshot() { return this.market.getSnapshot() }

  getMetadata() {
    const official = this.getSnapshot().overview.officialMarket
    return {
      source: official?.source ?? MOCK_DATA_SOURCE,
      updatedAt: official?.fetchedAt ?? MOCK_UPDATED_AT,
      isMock: !official || official.status === 'fallback',
      status: official?.status ?? 'fallback',
      warning: official?.warnings[0]
        ?? '目前市場資料使用 Mock 或 fallback；個股與法人官方資料狀態請以資料平台卡為準。',
    }
  }

  getPlatformStatus() {
    const snapshot = this.getSnapshot()
    return {
      provider: this.getProvider().descriptor,
      updatedAt: snapshot.overview.officialMarket?.fetchedAt ?? MOCK_UPDATED_AT,
      cache: this.market.getDiagnostics().cacheState,
      quality: snapshot.overview.officialMarket
        ? dataQuality.evaluateOfficial(snapshot.overview.officialMarket)
        : dataQuality.evaluate(snapshot.stocks, snapshot.overview),
      official: snapshot.overview.officialMarket,
      fallbackReason: this.market.getFallbackReason(),
      session: marketSession.getSession(),
      scheduler: refreshScheduler.list(),
    }
  }

  async getPlatformDataStatus(force = false): Promise<DataPlatformStatus> {
    const marketResult = force
      ? await this.market.refresh(undefined)
      : await this.market.read(undefined)

    const [stockStatus, institutionalStatus, industrySnapshot, industryMappingStatus] = await Promise.all([
      force
        ? this.stocks.refreshOfficialData()
            .then(() => this.stocks.getOfficialDatasetStatus())
            .catch(() => this.stocks.getOfficialDatasetStatus())
        : this.stocks.getOfficialDatasetStatus(),
      force
        ? this.institutions.refresh()
            .then(() => this.institutions.getDatasetStatus())
            .catch(() => this.institutions.getDatasetStatus())
        : this.institutions.getDatasetStatus(),
      this.industrySnapshots.getLatest().catch(() => null),
      force ? this.industryMapping.refresh().then(() => this.industryMapping.getStatus()).catch(() => this.industryMapping.getStatus()) : this.industryMapping.getStatus(),
    ])

    const officialMarket = marketResult.data.officialMarket
    const providerId = providerFactory.getActiveId()
    const market = providerId === 'mock'
      ? 'Mock'
      : officialMarket && officialMarket.status !== 'fallback'
        ? 'Official'
        : officialMarket?.status === 'fallback'
          ? 'Mock'
          : 'Missing'
    const stocks = mapOfficialDatasetState(stockStatus.available, stockStatus.status, stockStatus.stale)
    const institutions = mapOfficialDatasetState(
      institutionalStatus.available,
      institutionalStatus.status,
      institutionalStatus.stale,
    )

    let industry: IndustryPlatformState = 'Missing'
    if (industryMappingStatus.available && !industryMappingStatus.stale && industryMappingStatus.coverageRate === 100) industry = 'Official'
    else if (industryMappingStatus.available) industry = 'Partial'
    else if (industrySnapshot) industry = 'Derived'
    else if (this.industries.getSnapshot().length > 0) industry = 'Mock'

    const allCoreOfficial = market === 'Official' && stocks === 'Official' && institutions === 'Official'
    const summary = allCoreOfficial
      ? '市場、個股與法人欄位來自 TWSE 官方盤後資料；產業與部分分析仍為規則推導或模擬資料。'
      : providerId === 'mock'
        ? '目前市場 Provider 為 Mock；個股與法人官方資料狀態已分開顯示。請切換至 TWSE 官方資料。'
        : `市場 ${market}、個股 ${stocks}、法人 ${institutions}、產業 ${industry}；缺少或部分資料不會以官方完整資料呈現。`

    const selection = providerFactory.getSelectionState()
    const warnings = [
      ...(officialMarket?.warnings ?? []),
      ...stockStatus.warnings,
      ...institutionalStatus.warnings,
      ...industryMappingStatus.warnings,
    ]

    return {
      providerId,
      providerLabel: providerId === 'twse' ? 'TWSE Official' : 'Mock',
      market,
      stocks,
      institutions,
      industry,
      summary,
      warnings: [...new Set(warnings)],
      marketTradeDate: officialMarket?.tradeDate ?? null,
      stockTradeDate: stockStatus.tradeDate,
      institutionalTradeDate: institutionalStatus.tradeDate,
      updatedAt: [officialMarket?.fetchedAt, stockStatus.fetchedAt, institutionalStatus.fetchedAt]
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null,
      cache: this.market.getDiagnostics().cacheState,
      allCoreOfficial,
      canSwitchToTwse: providerId === 'mock',
      migrationNotice: selection.migrationNotice,
    }
  }
}

export const repositoryHub = new RepositoryHub()
