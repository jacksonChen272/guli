import type { MarketSnapshot, SnapshotIndex } from '../../types/snapshot'
import { validateMarketSnapshot } from '../snapshotValidationService'
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
export class SnapshotStorageError extends Error { constructor(public readonly code: 'NOT_FOUND' | 'INVALID_JSON' | 'INVALID_SCHEMA' | 'NETWORK', message: string) { super(message); this.name = 'SnapshotStorageError' } }
export class SnapshotStorage {
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>()
  constructor(private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis), private readonly baseUrl = import.meta.env.BASE_URL, private readonly ttlMs = 300_000) {}
  private async readJson<T>(path: string, validator: (value: unknown) => value is T): Promise<T> {
    const cached = this.cache.get(path); if (cached && cached.expiresAt > Date.now()) return cached.value as T
    let response: Response
    try { response = await this.fetcher(`${this.baseUrl}${path}`, { cache: 'no-cache', headers: { accept: 'application/json' } }) } catch { throw new SnapshotStorageError('NETWORK', '市場快照暫時無法讀取。') }
    if (!response.ok) throw new SnapshotStorageError('NOT_FOUND', '找不到指定的市場快照。')
    let value: unknown; try { value = await response.json() } catch { throw new SnapshotStorageError('INVALID_JSON', '市場快照格式錯誤。') }
    if (!validator(value)) throw new SnapshotStorageError('INVALID_SCHEMA', '市場快照版本或欄位不相容。')
    this.cache.set(path, { value, expiresAt: Date.now() + this.ttlMs }); return value
  }
  getIndex() { return this.readJson<SnapshotIndex>('data/history/index.json', isSnapshotIndex) }
  getLatest() { return this.readJson<MarketSnapshot>('data/history/latest.json', isSnapshot) }
  getByDate(date: string) { return this.readJson<MarketSnapshot>(`data/history/${date}.json`, isSnapshot) }
  async getHistory(days: number) { const index = await this.getIndex(); return Promise.all(index.snapshots.slice(0, Math.max(0, days)).map((item) => this.getByDate(item.tradeDate))) }
  clearCache() { this.cache.clear() }
}
const isSnapshot = (value: unknown): value is MarketSnapshot => validateMarketSnapshot(value).valid
const isSnapshotIndex = (value: unknown): value is SnapshotIndex => { if (!value || typeof value !== 'object') return false; const candidate = value as Partial<SnapshotIndex>; return candidate.schemaVersion === '1.0' && typeof candidate.updatedAt === 'string' && Array.isArray(candidate.snapshots) }
