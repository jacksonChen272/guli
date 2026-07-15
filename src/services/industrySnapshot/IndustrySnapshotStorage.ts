import type { IndustrySnapshot, IndustrySnapshotIndex } from '../../types/industrySnapshot'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
export class IndustrySnapshotStorageError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'INVALID_JSON' | 'INVALID_SCHEMA' | 'NETWORK', message: string) { super(message); this.name = 'IndustrySnapshotStorageError' }
}
const scoreIsValid = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100
export const isIndustrySnapshot = (value: unknown): value is IndustrySnapshot => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<IndustrySnapshot>
  if (candidate.schemaVersion !== '1.0' || candidate.market !== 'TWSE' || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.tradeDate ?? '') || !Array.isArray(candidate.industries)) return false
  const ranks = candidate.industries.map((item) => item.rank)
  return new Set(ranks).size === ranks.length && [...ranks].sort((a, b) => a - b).every((rank, index) => rank === index + 1) && candidate.industries.every((item) => scoreIsValid(item.strengthScore) && scoreIsValid(item.momentumScore) && scoreIsValid(item.capitalFlowScore) && scoreIsValid(item.breadthScore) && scoreIsValid(item.riskScore))
}
const isIndex = (value: unknown): value is IndustrySnapshotIndex => !!value && typeof value === 'object' && (value as Partial<IndustrySnapshotIndex>).schemaVersion === '1.0' && Array.isArray((value as Partial<IndustrySnapshotIndex>).snapshots)

export class IndustrySnapshotStorage {
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>()
  constructor(private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis), private readonly baseUrl = import.meta.env.BASE_URL, private readonly ttlMs = 300_000) {}
  private async readJson<T>(path: string, validator: (value: unknown) => value is T): Promise<T> {
    const cached = this.cache.get(path); if (cached && cached.expiresAt > Date.now()) return cached.value as T
    let response: Response
    try { response = await this.fetcher(`${this.baseUrl}${path}`, { cache: 'no-cache', headers: { accept: 'application/json' } }) } catch { throw new IndustrySnapshotStorageError('NETWORK', '無法讀取產業快照資料。') }
    if (!response.ok) throw new IndustrySnapshotStorageError('NOT_FOUND', '找不到指定的產業快照。')
    let value: unknown
    try { value = await response.json() } catch { throw new IndustrySnapshotStorageError('INVALID_JSON', '產業快照不是有效 JSON。') }
    if (!validator(value)) throw new IndustrySnapshotStorageError('INVALID_SCHEMA', '產業快照格式或版本不相容。')
    this.cache.set(path, { value, expiresAt: Date.now() + this.ttlMs }); return value
  }
  getIndex() { return this.readJson('data/industry-history/index.json', isIndex) }
  getLatest() { return this.readJson('data/industry-history/latest.json', isIndustrySnapshot) }
  getByDate(date: string) { return this.readJson(`data/industry-history/${date}.json`, isIndustrySnapshot) }
  async getHistory(days: number) { const index = await this.getIndex(); return Promise.all(index.snapshots.slice(0, Math.max(0, days)).map((item) => this.getByDate(item.tradeDate))) }
  clearCache() { this.cache.clear() }
}
