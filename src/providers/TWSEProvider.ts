import type { DataResult, ProviderMarketOverview } from '../types/api'
import { isOfficialMarketOverview, type OfficialMarketOverview } from '../types/marketData'
import { validateOfficialMarketOverview } from '../services/dataValidationService'
import { FutureProviderBase } from './FutureProviderBase'
import { ProviderDataError, type ProviderDescriptor } from './ProviderTypes'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class TWSEProvider extends FutureProviderBase {
  readonly descriptor: ProviderDescriptor = {
    id: 'twse', name: '臺灣證券交易所盤後資料',
    description: '讀取部署於網站內的 TWSE 官方市場總覽靜態 JSON；不會由瀏覽器直接呼叫 TWSE。',
    enabled: true, isMock: false,
  }
  private lastUpdatedAt?: string
  constructor(private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis), private readonly baseUrl = import.meta.env.BASE_URL) { super() }
  private get jsonUrl() { return `${this.baseUrl}data/twse-market-overview.json` }
  async getMarketOverview(): Promise<DataResult<ProviderMarketOverview>> {
    let response: Response
    try { response = await this.fetcher(this.jsonUrl, { headers: { accept: 'application/json' }, cache: 'no-cache' }) }
    catch (error) { throw new ProviderDataError('TWSE_JSON_UNREACHABLE', '無法讀取 TWSE 市場資料檔。', error) }
    if (!response.ok) throw new ProviderDataError('TWSE_JSON_NOT_FOUND', `TWSE 市場資料檔不存在（HTTP ${response.status}）。`)
    let payload: unknown
    try { payload = await response.json() }
    catch (error) { throw new ProviderDataError('TWSE_JSON_INVALID', 'TWSE 市場資料檔不是有效 JSON。', error) }
    if (!isOfficialMarketOverview(payload)) throw new ProviderDataError('TWSE_DATA_SHAPE_INVALID', 'TWSE 市場資料缺少必要欄位。')
    const official: OfficialMarketOverview = payload
    const validation = validateOfficialMarketOverview(official)
    if (!validation.valid) throw new ProviderDataError('TWSE_DATA_INVALID', 'TWSE 市場資料驗證失敗。', validation.errors)
    const data: OfficialMarketOverview = { ...official, status: official.status, warnings: validation.warnings }
    this.lastUpdatedAt = data.fetchedAt
    return { data, source: data.source, updatedAt: data.fetchedAt, status: validation.stale ? 'stale' : 'success', warnings: data.warnings }
  }
  async getLastUpdatedAt() { if (!this.lastUpdatedAt) await this.getMarketOverview(); return this.lastUpdatedAt ?? '' }
}
