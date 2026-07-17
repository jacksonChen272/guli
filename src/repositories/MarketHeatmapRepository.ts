import { isHeatmapStale, validateHeatmapDataset } from '../services/heatmap/HeatmapDataService'
import { summarizeHeatmap } from '../services/heatmap/HeatmapSummaryService'
import type { MarketHeatmapDataset } from '../types/marketHeatmap'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class MarketHeatmapRepository {
  private dataset: MarketHeatmapDataset | null = null
  private inFlight: Promise<MarketHeatmapDataset> | null = null

  constructor(private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis), private readonly baseUrl = import.meta.env.BASE_URL) {}

  async getLatest(force = false) {
    if (!force && this.dataset) return this.dataset
    if (!force && this.inFlight) return this.inFlight
    this.inFlight = this.readLatest().finally(() => { this.inFlight = null })
    return this.inFlight
  }

  private async readLatest() {
    const response = await this.fetcher(`${this.baseUrl}data/market-heatmap/latest.json`, { cache: 'no-cache', headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`市場熱力圖資料讀取失敗（HTTP ${response.status}）。`)
    const dataset = await response.json() as MarketHeatmapDataset
    const errors = validateHeatmapDataset(dataset)
    if (errors.length) throw new Error(`市場熱力圖資料未通過驗證：${errors[0]}`)
    this.dataset = isHeatmapStale(dataset.tradeDate) ? { ...dataset, status: 'stale', warnings: [...dataset.warnings, '熱力圖資料日期可能已過期。'] } : dataset
    return this.dataset
  }

  async getIndustry(industryId: string) { return (await this.getLatest()).industries.find((node) => node.industryId === industryId) ?? null }
  async getStocks(industryId?: string) { const dataset = await this.getLatest(); return industryId ? dataset.stocks.filter((node) => node.industryId === industryId) : dataset.stocks }
  async getSummary() { return summarizeHeatmap(await this.getLatest()) }
  refresh() { return this.getLatest(true) }
  clearCache() { this.dataset = null; this.inFlight = null }
}
