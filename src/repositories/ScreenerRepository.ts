import type { ScreenerDataset, ScreenerPresetId, ScreenerResult, TechnicalIndexDataset } from '../types/screener'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class ScreenerRepository {
  private dataset: ScreenerDataset | null = null
  private technicalIndex: TechnicalIndexDataset | null = null
  constructor(private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis), private readonly baseUrl = import.meta.env.BASE_URL) {}

  private async read<T>(path: string): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, { cache: 'no-cache', headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`選股資料讀取失敗（HTTP ${response.status}）。`)
    return response.json() as Promise<T>
  }

  async getDataset(force = false) {
    if (!force && this.dataset) return this.dataset
    const dataset = await this.read<ScreenerDataset>('data/screener/latest.json')
    if (dataset.schemaVersion !== '1.0' || !Array.isArray(dataset.results)) throw new Error('選股資料未通過結構驗證。')
    this.dataset = dataset
    return dataset
  }

  async getTechnicalIndex(force = false) {
    if (!force && this.technicalIndex) return this.technicalIndex
    const dataset = await this.read<TechnicalIndexDataset>('data/technical-index/latest.json')
    if (dataset.schemaVersion !== '1.0' || !Array.isArray(dataset.records)) throw new Error('技術索引未通過結構驗證。')
    this.technicalIndex = dataset
    return dataset
  }

  async getPresetResults(presetId: ScreenerPresetId): Promise<ScreenerResult[]> { return (await this.getDataset()).results.filter((row) => row.presetId === presetId && row.matched) }
  async getDashboardSummary() { const dataset = await this.getDataset(); return { sampleCount: dataset.sampleCount, tradeDate: dataset.tradeDate, generatedAt: dataset.generatedAt, highRiskCount: dataset.highRiskCount, coveragePercent: dataset.sampleCount ? Math.round(dataset.complete250Count / dataset.sampleCount * 100) : 0, presets: dataset.presets } }
  refresh() { this.clearCache(); return this.getDataset(true) }
  clearCache() { this.dataset = null; this.technicalIndex = null }
}
