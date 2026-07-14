import type { CacheStore, CacheState } from '../cache/Cache'
import { CachePolicy, type CacheResource } from '../cache/CachePolicy'
import type { DataResult } from '../types/api'
import type { Repository, RepositoryDiagnostics, RepositoryReadOptions } from './Repository'

export abstract class BaseRepository<TData, TQuery = void> implements Repository<TData, TQuery> {
  private diagnostics: RepositoryDiagnostics
  private readonly ownedKeys = new Set<string>()
  constructor(protected readonly name: string, protected readonly resource: CacheResource, protected readonly cache: CacheStore, protected readonly policy: CachePolicy) { this.diagnostics = { name, cacheState: 'miss' } }
  protected abstract fetch(query: TQuery): Promise<DataResult<TData>>
  protected cacheKey(query: TQuery) { return `${this.name}:${JSON.stringify(query ?? null)}` }
  async read(query: TQuery, options: RepositoryReadOptions = {}): Promise<DataResult<TData>> {
    const key = this.cacheKey(query)
    this.ownedKeys.add(key)
    if (!options.forceRefresh) { const cached = this.cache.get<DataResult<TData>>(key); this.mark(cached.state, key); if (cached.entry && cached.state === 'hit') return cached.entry.value; if (cached.entry && cached.state === 'stale' && this.policy.shouldServeStale(this.resource)) return { ...cached.entry.value, status: 'stale', warnings: [...cached.entry.value.warnings, '目前使用過期快取，等待排程更新。'] } }
    const result = await this.fetch(query); this.cache.set(key, result, this.policy.getTtl(this.resource), result.source); this.mark('miss', key); return result
  }
  refresh(query: TQuery) { return this.read(query, { forceRefresh: true }) }
  invalidate(query?: TQuery) { if (query !== undefined) { const key = this.cacheKey(query); this.cache.delete(key); this.ownedKeys.delete(key); return } this.ownedKeys.forEach((key) => this.cache.delete(key)); this.ownedKeys.clear() }
  getDiagnostics() { return { ...this.diagnostics } }
  private mark(cacheState: CacheState, cacheKey: string) { this.diagnostics = { name: this.name, cacheState, cacheKey, lastReadAt: new Date().toISOString() } }
}
