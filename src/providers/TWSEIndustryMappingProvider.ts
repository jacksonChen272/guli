import { calculateIndustryMappingCoverage } from '../services/industryMapping/IndustryMappingCoverageService'
import { isIndustryMappingStale, validateIndustryMappingDataset } from '../services/industryMapping/IndustryMappingValidator'
import type { IndustryMappingDatasetStatusResult, OfficialIndustryMappingDataset } from '../types/officialIndustryMapping'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class TWSEIndustryMappingProviderError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'NETWORK' | 'INVALID_JSON' | 'INVALID_DATASET', message: string) { super(message); this.name = 'TWSEIndustryMappingProviderError' }
}

export class TWSEIndustryMappingProvider {
  private dataset: OfficialIndustryMappingDataset | null = null
  private inFlight: Promise<OfficialIndustryMappingDataset> | null = null
  private expiresAt = 0

  constructor(private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis), private readonly baseUrl = import.meta.env.BASE_URL, private readonly ttlMs = 86_400_000) {}

  async getLatest(force = false) {
    if (!force && this.dataset && this.expiresAt > Date.now()) return this.dataset
    if (!force && this.inFlight) return this.inFlight
    this.inFlight = this.read().finally(() => { this.inFlight = null })
    return this.inFlight
  }

  private async read() {
    let response: Response
    try { response = await this.fetcher(`${this.baseUrl}data/twse-industries/latest.json`, { cache: 'no-cache', headers: { accept: 'application/json' } }) }
    catch { throw new TWSEIndustryMappingProviderError('NETWORK', '無法讀取 TWSE 官方產業分類資料。') }
    if (!response.ok) throw new TWSEIndustryMappingProviderError('NOT_FOUND', `TWSE 官方產業分類資料不存在（HTTP ${response.status}）。`)
    let value: unknown
    try { value = await response.json() } catch { throw new TWSEIndustryMappingProviderError('INVALID_JSON', 'TWSE 官方產業分類檔不是有效 JSON。') }
    const validation = validateIndustryMappingDataset(value as OfficialIndustryMappingDataset)
    if (!validation.valid) throw new TWSEIndustryMappingProviderError('INVALID_DATASET', `TWSE 官方產業分類驗證失敗：${validation.errors[0]}`)
    this.dataset = value as OfficialIndustryMappingDataset
    this.expiresAt = Date.now() + this.ttlMs
    return this.dataset
  }

  async getStatus(): Promise<IndustryMappingDatasetStatusResult> {
    try {
      const dataset = await this.getLatest()
      const coverage = calculateIndustryMappingCoverage(dataset)
      return { available: true, status: dataset.status, effectiveDate: dataset.effectiveDate, fetchedAt: dataset.fetchedAt, stale: isIndustryMappingStale(dataset.effectiveDate), warnings: dataset.warnings, ...coverage }
    } catch (error) {
      return { available: false, status: 'missing', effectiveDate: null, fetchedAt: null, stale: true, warnings: [error instanceof Error ? error.message : 'TWSE 官方產業分類不可用。'], totalStocks: 0, mappedStocks: 0, unmappedStocks: 0, industryCount: 0, coverageRate: 0 }
    }
  }

  refresh() { return this.getLatest(true) }
  clearCache() { this.dataset = null; this.inFlight = null; this.expiresAt = 0 }
}
