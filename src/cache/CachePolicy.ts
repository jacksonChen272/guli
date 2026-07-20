export type CacheResource = 'market' | 'stocks' | 'stock-detail' | 'official-stocks' | 'stock-history' | 'industries' | 'industry-mapping' | 'institutions' | 'events' | 'watchlist' | 'watchlist-dashboard' | 'snapshots' | 'industry-snapshots'

export class CachePolicy {
  constructor(private readonly ttl: Partial<Record<CacheResource, number>> = {}) {}
  getTtl(resource: CacheResource) { return this.ttl[resource] ?? ({ market: 60_000, stocks: 300_000, 'stock-detail': 120_000, 'official-stocks': 300_000, 'stock-history': 300_000, industries: 300_000, 'industry-mapping': 86_400_000, institutions: 180_000, events: 600_000, watchlist: 30_000, 'watchlist-dashboard': 86_400_000, snapshots: 300_000, 'industry-snapshots': 300_000 } satisfies Record<CacheResource, number>)[resource] }
  shouldServeStale(resource: CacheResource) { return resource !== 'institutions' }
}
