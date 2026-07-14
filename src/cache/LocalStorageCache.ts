import type { CacheEntry, CacheReadResult, CacheStore } from './Cache'

export interface StorageLike { readonly length: number; key(index: number): string | null; getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; clear(): void }

export class LocalStorageCache implements CacheStore {
  constructor(private readonly prefix = 'guli-cache:', private readonly storage?: StorageLike) {}
  private target() { return this.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined) }
  private key(key: string) { return `${this.prefix}${key}` }
  get<T>(key: string, now = Date.now()): CacheReadResult<T> { const raw = this.target()?.getItem(this.key(key)); if (!raw) return { state: 'miss' }; try { const entry = JSON.parse(raw) as CacheEntry<T>; return { state: entry.expiresAt > now ? 'hit' : 'stale', entry } } catch { this.delete(key); return { state: 'miss' } } }
  set<T>(key: string, value: T, ttlMs: number, source: string, now = Date.now()) { this.target()?.setItem(this.key(key), JSON.stringify({ value, source, createdAt: now, expiresAt: now + ttlMs } satisfies CacheEntry<T>)) }
  delete(key: string) { this.target()?.removeItem(this.key(key)) }
  clear() { const target = this.target(); if (!target) return; const keys: string[] = []; for (let index = 0; index < target.length; index += 1) { const key = target.key(index); if (key?.startsWith(this.prefix)) keys.push(key) } keys.forEach((key) => target.removeItem(key)) }
}
