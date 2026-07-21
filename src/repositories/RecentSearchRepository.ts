export interface RecentSearchStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const STORAGE_KEY = 'guli-recent-stock-searches'
const MAX_RECENT = 10

const browserStorage = (): RecentSearchStorage | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

export class RecentSearchRepository {
  private readonly listeners = new Set<(symbols: string[]) => void>()
  constructor(private readonly storage: RecentSearchStorage | null = browserStorage()) {}

  getRecent(limit = MAX_RECENT) {
    try {
      const value: unknown = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? '[]')
      if (!Array.isArray(value)) return []
      return [...new Set(value.filter((item): item is string => typeof item === 'string' && /^\d{4,6}$/.test(item)))].slice(0, Math.min(MAX_RECENT, Math.max(0, limit)))
    } catch { return [] }
  }

  record(symbol: string) {
    const normalized = symbol.trim()
    if (!/^\d{4,6}$/.test(normalized)) return this.getRecent()
    const next = [normalized, ...this.getRecent().filter((item) => item !== normalized)].slice(0, MAX_RECENT)
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* Storage may be disabled; search still works. */ }
    this.listeners.forEach((listener) => listener(next))
    return next
  }

  clear() {
    try { this.storage?.removeItem(STORAGE_KEY) } catch { /* Storage may be disabled. */ }
    this.listeners.forEach((listener) => listener([]))
  }

  subscribe(listener: (symbols: string[]) => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}

