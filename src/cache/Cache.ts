export type CacheState = 'hit' | 'miss' | 'stale'

export interface CacheEntry<T> {
  value: T
  createdAt: number
  expiresAt: number
  source: string
}

export interface CacheReadResult<T> {
  state: CacheState
  entry?: CacheEntry<T>
}

export interface CacheStore {
  get<T>(key: string, now?: number): CacheReadResult<T>
  set<T>(key: string, value: T, ttlMs: number, source: string, now?: number): void
  delete(key: string): void
  clear(): void
}
