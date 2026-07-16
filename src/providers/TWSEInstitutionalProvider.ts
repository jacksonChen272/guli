import { isInstitutionalStale, validateInstitutionalDataset } from '../services/institutionalData/InstitutionalValidator'
import type { InstitutionalDatasetStatus, OfficialInstitutionalDataset, OfficialInstitutionalIndex } from '../types/officialInstitutionalData'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
export class TWSEInstitutionalProviderError extends Error { constructor(public readonly code: 'NOT_FOUND' | 'NETWORK' | 'INVALID_JSON' | 'INVALID_DATASET', message: string) { super(message); this.name = 'TWSEInstitutionalProviderError' } }

export class TWSEInstitutionalProvider {
  private cache = new Map<string, { value: unknown; expiresAt: number }>()
  constructor(private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis), private readonly baseUrl = import.meta.env.BASE_URL, private readonly ttlMs = 300_000) {}
  private async read<T>(path: string, validate: (value: unknown) => value is T): Promise<T> {
    const cached = this.cache.get(path); if (cached && cached.expiresAt > Date.now()) return cached.value as T
    let response: Response
    try { response = await this.fetcher(`${this.baseUrl}${path}`, { cache: 'no-cache', headers: { accept: 'application/json' } }) } catch { throw new TWSEInstitutionalProviderError('NETWORK', '無法讀取 TWSE 法人靜態資料。') }
    if (!response.ok) throw new TWSEInstitutionalProviderError('NOT_FOUND', 'TWSE 法人資料檔不存在。')
    let value: unknown
    try { value = await response.json() } catch { throw new TWSEInstitutionalProviderError('INVALID_JSON', 'TWSE 法人資料不是有效 JSON。') }
    if (!validate(value)) throw new TWSEInstitutionalProviderError('INVALID_DATASET', 'TWSE 法人資料驗證失敗。')
    this.cache.set(path, { value, expiresAt: Date.now() + this.ttlMs }); return value
  }
  getLatestDataset() { return this.read('data/twse-institutional/latest.json', isDataset) }
  getIndex() { return this.read('data/twse-institutional/index.json', isIndex) }
  async getLastUpdatedAt() { return (await this.getLatestDataset()).fetchedAt }
  async getStatus(): Promise<InstitutionalDatasetStatus> { try { const dataset = await this.getLatestDataset(); const stale = isInstitutionalStale(dataset.tradeDate); return { available: true, tradeDate: dataset.tradeDate, fetchedAt: dataset.fetchedAt, recordCount: dataset.records.length, status: stale ? 'stale' : dataset.status, stale, warnings: [...dataset.warnings, ...(stale ? ['法人資料可能已過期。'] : [])] } } catch (error) { return { available: false, tradeDate: null, fetchedAt: null, recordCount: 0, status: 'missing', stale: true, warnings: [error instanceof Error ? error.message : 'TWSE 法人資料不可用。'] } } }
  clearCache() { this.cache.clear() }
}
const isDataset = (value: unknown): value is OfficialInstitutionalDataset => !!value && typeof value === 'object' && validateInstitutionalDataset(value as OfficialInstitutionalDataset).valid
const isIndex = (value: unknown): value is OfficialInstitutionalIndex => !!value && typeof value === 'object' && (value as Partial<OfficialInstitutionalIndex>).schemaVersion === '1.0' && Array.isArray((value as Partial<OfficialInstitutionalIndex>).datasets)
