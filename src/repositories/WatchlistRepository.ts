import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { useWatchlistStore } from '../stores/watchlistStore'
import type { WatchlistItem } from '../types/stock'
import { createDataResult } from '../services/dataNormalizationService'
import { BaseRepository } from './BaseRepository'
import type { OfficialStockDailyRecord } from '../types/officialStockData'
import type { WatchlistPreviewItem } from '../types/dashboardIntelligence'

export class WatchlistRepository extends BaseRepository<WatchlistItem[], void> {
  constructor(cache: CacheStore, policy: CachePolicy, private readonly getOfficialStocks?: (symbols: string[]) => Promise<OfficialStockDailyRecord[]>) { super('watchlist', 'watchlist', cache, policy) }
  protected fetch() { return Promise.resolve(createDataResult(useWatchlistStore.getState().items, { source: '瀏覽器 LocalStorage', updatedAt: new Date().toISOString() })) }
  add(symbol: string, groupId?: string) { useWatchlistStore.getState().add(symbol, groupId); this.invalidate(undefined) }
  remove(symbol: string) { useWatchlistStore.getState().remove(symbol); this.invalidate(undefined) }
  update(symbol: string, changes: Partial<Omit<WatchlistItem, 'symbol' | 'createdAt'>>) { useWatchlistStore.getState().edit(symbol, changes); this.invalidate(undefined) }
  getSnapshot() { return useWatchlistStore.getState().items }
  async getPreview(limit = 5): Promise<WatchlistPreviewItem[]> {
    const symbols = this.getSnapshot().map((item) => item.symbol).slice(0, Math.max(0, limit))
    if (!symbols.length) return []
    if (!this.getOfficialStocks) return symbols.map((symbol) => ({ symbol, name: symbol, close: null, changePercent: null, tradeDate: null, source: 'Missing' as const }))
    const quotes = await this.getOfficialStocks(symbols).catch(() => [])
    const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]))
    return symbols.map((symbol) => {
      const quote = bySymbol.get(symbol)
      const changePercent = quote?.close !== null && quote?.close !== undefined && quote.change !== null
        ? quote.change / Math.max(quote.close - quote.change, 0.01) * 100 : null
      return { symbol, name: quote?.name ?? symbol, close: quote?.close ?? null, changePercent, tradeDate: quote?.tradeDate ?? null, source: quote ? 'TWSE Official' as const : 'Missing' as const }
    })
  }
}
