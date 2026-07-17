import { validateOfficialStockHistory } from '../services/stockHistory/StockHistoryValidator'
import type { OfficialStockHistory, StockHistoryBackfillProgress, StockHistoryDatasetStatus, StockHistoryIndex } from '../types/officialStockHistory'

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export class TWSEStockHistoryProviderError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'NETWORK' | 'INVALID_JSON' | 'INVALID_DATASET', message: string) {
    super(message)
    this.name = 'TWSEStockHistoryProviderError'
  }
}

const isIndex = (value: unknown): value is StockHistoryIndex => {
  if (!value || typeof value !== 'object') return false
  const index = value as Partial<StockHistoryIndex>
  return index.schemaVersion === '1.0' && index.source === 'TWSE' && Array.isArray(index.symbols) && Boolean(index.summary)
}

export class TWSEStockHistoryProvider {
  private cache = new Map<string, { value: unknown; expiresAt: number }>()

  constructor(
    private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis),
    private readonly baseUrl = import.meta.env.BASE_URL,
    private readonly ttlMs = 300_000,
  ) {}

  private getHistoryPath(symbol: string) { return `data/twse-stock-history/stocks/${symbol}.json` }

  getResolvedHistoryUrl(symbol: string, origin?: string) {
    const resource = `${this.baseUrl}${this.getHistoryPath(symbol)}`
    const baseOrigin = origin ?? (typeof window === 'undefined' ? undefined : window.location.origin)
    return baseOrigin ? new URL(resource, baseOrigin).href : resource
  }

  private async read<T>(path: string, validate: (value: unknown) => value is T): Promise<T> {
    const cached = this.cache.get(path)
    if (cached && cached.expiresAt > Date.now()) return cached.value as T
    let response: Response
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, { cache: 'no-cache', headers: { accept: 'application/json' } })
    } catch {
      throw new TWSEStockHistoryProviderError('NETWORK', '無法讀取 TWSE 官方歷史行情檔案。')
    }
    if (!response.ok) throw new TWSEStockHistoryProviderError('NOT_FOUND', '尚未取得此股票的 TWSE 官方歷史行情。')
    let value: unknown
    try {
      value = await response.json()
    } catch {
      throw new TWSEStockHistoryProviderError('INVALID_JSON', 'TWSE 歷史行情檔案不是有效 JSON。')
    }
    if (!validate(value)) throw new TWSEStockHistoryProviderError('INVALID_DATASET', 'TWSE 歷史行情未通過資料驗證。')
    this.cache.set(path, { value, expiresAt: Date.now() + this.ttlMs })
    return value
  }

  getIndex() { return this.read('data/twse-stock-history/index.json', isIndex) }

  getBackfillProgress() { return this.read('data/twse-stock-history/backfill-progress.json', (value): value is StockHistoryBackfillProgress => Boolean(value && typeof value === 'object' && 'totalSymbols' in value && 'completedSymbols' in value && 'status' in value)) }

  getHistory(symbol: string) {
    return this.read(this.getHistoryPath(symbol), (value): value is OfficialStockHistory => {
      if (!value || typeof value !== 'object') return false
      const dataset = value as OfficialStockHistory
      return dataset.schemaVersion === '1.0' && dataset.symbol === symbol && validateOfficialStockHistory(dataset).valid
    })
  }

  async getAvailableSymbols() { return (await this.getIndex()).symbols.map((item) => item.symbol) }
  async getLastUpdatedAt() { return (await this.getIndex()).updatedAt }

  async getDatasetStatus(): Promise<StockHistoryDatasetStatus> {
    try {
      const index = await this.getIndex()
      const computable = index.symbols.filter((item) => item.technical.indicatorComputable).length
      return {
        available: index.symbols.length > 0,
        source: 'TWSE',
        updatedAt: index.updatedAt,
        availableSymbols: index.summary.availableSymbols,
        averageRecordCount: index.summary.averageRecordCount,
        complete250Percent: index.symbols.length ? Math.round(index.summary.complete250Count / index.symbols.length * 100) : 0,
        indicatorComputablePercent: index.symbols.length ? Math.round(computable / index.symbols.length * 100) : 0,
        staleCount: index.summary.staleCount,
        failedSymbols: index.summary.failedSymbols,
        warnings: index.summary.failedSymbols.length ? [`${index.summary.failedSymbols.length} 檔歷史行情同步失敗`] : [],
      }
    } catch (error) {
      return { available: false, source: 'TWSE', updatedAt: null, availableSymbols: 0, averageRecordCount: 0, complete250Percent: 0, indicatorComputablePercent: 0, staleCount: 0, failedSymbols: [], warnings: [error instanceof Error ? error.message : '歷史行情狀態無法取得'] }
    }
  }

  clearCache(symbol?: string) {
    if (symbol) this.cache.delete(this.getHistoryPath(symbol))
    else this.cache.clear()
  }
}
