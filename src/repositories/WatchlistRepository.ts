import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { useWatchlistStore } from '../stores/watchlistStore'
import type { WatchlistItem } from '../types/stock'
import { createDataResult } from '../services/dataNormalizationService'
import { BaseRepository } from './BaseRepository'

export class WatchlistRepository extends BaseRepository<WatchlistItem[], void> {
  constructor(cache: CacheStore, policy: CachePolicy) { super('watchlist', 'watchlist', cache, policy) }
  protected fetch() { return Promise.resolve(createDataResult(useWatchlistStore.getState().items, { source: '瀏覽器 LocalStorage', updatedAt: new Date().toISOString() })) }
  add(symbol: string, groupId?: string) { useWatchlistStore.getState().add(symbol, groupId); this.invalidate(undefined) }
  remove(symbol: string) { useWatchlistStore.getState().remove(symbol); this.invalidate(undefined) }
  update(symbol: string, changes: Partial<Omit<WatchlistItem, 'symbol' | 'createdAt'>>) { useWatchlistStore.getState().edit(symbol, changes); this.invalidate(undefined) }
  getSnapshot() { return useWatchlistStore.getState().items }
}
