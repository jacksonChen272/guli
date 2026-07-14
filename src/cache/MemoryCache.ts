import type { CacheEntry, CacheReadResult, CacheStore } from './Cache'

export class MemoryCache implements CacheStore {
  private entries = new Map<string, CacheEntry<unknown>>()
  get<T>(key: string, now = Date.now()): CacheReadResult<T> { const entry = this.entries.get(key) as CacheEntry<T> | undefined; if (!entry) return { state: 'miss' }; return { state: entry.expiresAt > now ? 'hit' : 'stale', entry } }
  set<T>(key: string, value: T, ttlMs: number, source: string, now = Date.now()) { this.entries.set(key, { value, source, createdAt: now, expiresAt: now + ttlMs }) }
  delete(key: string) { this.entries.delete(key) }
  clear() { this.entries.clear() }
  size() { return this.entries.size }
}
