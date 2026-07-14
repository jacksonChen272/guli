export type CacheResource = 'market' | 'stocks' | 'stock-detail' | 'industries' | 'institutions' | 'events' | 'watchlist'

export class CachePolicy {
  constructor(private readonly ttl: Partial<Record<CacheResource, number>> = {}) {}
  getTtl(resource: CacheResource) { return this.ttl[resource] ?? ({ market: 60_000, stocks: 300_000, 'stock-detail': 120_000, industries: 300_000, institutions: 180_000, events: 600_000, watchlist: 30_000 } satisfies Record<CacheResource, number>)[resource] }
  shouldServeStale(resource: CacheResource) { return resource !== 'institutions' }
}
