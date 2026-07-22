import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { TwseHistoryFetcher, TWSE_HISTORY_ENDPOINT, buildMonthKeys } from './TwseHistoryFetcher.ts'
import { categorizeHistoryError, HistoryRetryQueue } from './HistoryRetryQueue.ts'
import { HistoryRateLimiter } from './HistoryRateLimiter.ts'
import { mergeHistoryPoints, sanitizeHistoryPoints, validateHistoryDataset } from './HistoryValidator.ts'
import { atomicWriteJson, buildHistoryManifest, buildProgress, readJson } from './HistoryManifestWriter.ts'
import type { HistoryFailure, HistoryProgress, HistorySecurity, TwseHistoryDataset } from './types.ts'

export interface HistoryBatchOptions {
  root: string; batchSize: number; limit: number; startSymbol: string | null; symbols: string[]; startMonth: string | null
  targetDays: number; technicalMinimumDays: number; requestDelay: number; batchDelay: number; maxRetries: number
  forceRefresh: boolean; retryFailedOnly: boolean; dryRun: boolean; incremental: boolean; timeout: number
}

export interface HistoryBatchSummary {
  schemaVersion: 'history-backfill-summary-v1'; startedAt: string; completedAt: string; requested: number; updated: number
  skipped: number; failed: number; partial: number; complete: number; totalCommonStocks: number; selectedSymbols: string[]
  failures: HistoryFailure[]; targetTradingDays: number; dryRun: boolean
}

const defaultDataset = (symbol: string, name: string): TwseHistoryDataset => ({ schemaVersion: '1.0', symbol, name, market: 'TWSE', source: 'TWSE', sourceUrl: TWSE_HISTORY_ENDPOINT, fetchedAt: new Date(0).toISOString(), firstTradeDate: null, lastTradeDate: null, recordCount: 0, status: 'partial', warnings: [], prices: [] })
const stale = (date: string | null) => !date || (Date.now() - Date.parse(`${date}T00:00:00Z`)) / 86_400_000 > 7

export class HistoryBatchRunner {
  private readonly options: HistoryBatchOptions
  private readonly stockDirectory: string
  private readonly manifestPath: string
  private readonly progressPath: string
  private readonly reportPath: string
  private readonly fetcher: Pick<TwseHistoryFetcher, 'fetchMonth'>

  constructor(options: HistoryBatchOptions, fetcher?: Pick<TwseHistoryFetcher, 'fetchMonth'>) {
    this.options = options
    this.stockDirectory = path.join(options.root, 'public', 'data', 'twse-stock-history', 'stocks')
    this.manifestPath = path.join(options.root, 'public', 'data', 'history', 'history-manifest.json')
    this.progressPath = path.join(options.root, 'data', 'history', 'history-progress.json')
    this.reportPath = path.join(options.root, 'reports', 'history-backfill-summary.json')
    this.fetcher = fetcher ?? new TwseHistoryFetcher(fetch, new HistoryRateLimiter(options.requestDelay, options.batchDelay), new HistoryRetryQueue(options.maxRetries), options.timeout)
  }

  async loadUniverse(): Promise<{ securities: HistorySecurity[]; latestTradeDate: string | null }> {
    const source = await readJson<{ tradeDate?: string; records?: Array<{ symbol: string; name: string; instrumentType: string }> }>(path.join(this.options.root, 'public', 'data', 'twse-stocks', 'latest.json'), {})
    return { securities: (source.records ?? []).map((item) => ({ symbol: item.symbol, name: item.name, instrumentType: item.instrumentType ?? 'unknown' })), latestTradeDate: source.tradeDate ?? null }
  }

  async loadDatasets(securities: HistorySecurity[]): Promise<Map<string, TwseHistoryDataset>> {
    const allowed = new Set(securities.map((item) => item.symbol)); const datasets = new Map<string, TwseHistoryDataset>()
    const files = await readdir(this.stockDirectory).catch(() => [])
    for (const file of files.filter((item) => /^\d{4}\.json$/.test(item))) {
      const symbol = file.slice(0, 4); if (!allowed.has(symbol)) continue
      const dataset = await readJson<TwseHistoryDataset | null>(path.join(this.stockDirectory, file), null)
      if (dataset) datasets.set(symbol, dataset)
    }
    return datasets
  }

  selectSymbols(securities: HistorySecurity[], datasets: Map<string, TwseHistoryDataset>, previous: HistoryProgress | null): HistorySecurity[] {
    const common = securities.filter((item) => item.instrumentType === 'stock' && /^\d{4}$/.test(item.symbol)).sort((a, b) => a.symbol.localeCompare(b.symbol))
    let rows = this.options.symbols.length ? common.filter((item) => this.options.symbols.includes(item.symbol)) : common
    if (this.options.retryFailedOnly) { const failed = new Set(previous?.failedSymbols.map((item) => item.symbol) ?? []); rows = rows.filter((item) => failed.has(item.symbol)) }
    if (this.options.startSymbol) rows = rows.filter((item) => item.symbol.localeCompare(this.options.startSymbol as string) >= 0)
    if (this.options.incremental) rows = rows.filter((item) => { const dataset = datasets.get(item.symbol); return Boolean(dataset && validateHistoryDataset(dataset, item.symbol).valid) })
    if (!this.options.forceRefresh && !this.options.incremental) rows = rows.filter((item) => { const dataset = datasets.get(item.symbol); return !dataset || !validateHistoryDataset(dataset, item.symbol).valid || dataset.recordCount < this.options.targetDays })
    return rows.slice(0, this.options.limit)
  }

  async syncSecurity(security: HistorySecurity, existing: TwseHistoryDataset | undefined, latestTradeDate: string | null) {
    if (!this.options.forceRefresh && existing && validateHistoryDataset(existing, security.symbol).valid && existing.recordCount >= this.options.targetDays && existing.lastTradeDate === latestTradeDate) return { dataset: existing, skipped: true }
    let dataset = existing ?? defaultDataset(security.symbol, security.name); const warnings = [...dataset.warnings]
    const requiredMonths = this.options.incremental ? 2 : Math.min(48, Math.max(2, Math.ceil(Math.max(0, this.options.targetDays - dataset.prices.length) / 18) + 2))
    const firstDate = existing?.firstTradeDate
    const previousMonth = firstDate ? (() => { const date = new Date(`${firstDate.slice(0, 7)}-01T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() - 1); return date.toISOString().slice(0, 7) })() : null
    const startMonth = this.options.startMonth ?? (!this.options.incremental ? previousMonth : null)
    for (const month of buildMonthKeys(startMonth, requiredMonths)) {
      try {
        const result = await this.fetcher.fetchMonth(security.symbol, month)
        dataset = { ...dataset, name: result.name || dataset.name, prices: mergeHistoryPoints(dataset.prices, result.points) }; warnings.push(...result.warnings)
      } catch (error) {
        if (categorizeHistoryError(error) === 'NO_DATA') { warnings.push(`${month.slice(0, 6)} 無官方交易資料`); continue }
        throw error
      }
      if (!this.options.incremental && dataset.prices.length >= this.options.targetDays) break
    }
    const sanitized = sanitizeHistoryPoints(dataset.prices)
    if (sanitized.rejected) warnings.push(`排除 ${sanitized.rejected} 筆缺少有效 OHLC 的 TWSE 原始列；未以 0 或模擬值補入`)
    const fetchedAt = new Date().toISOString(); const prices = sanitized.points
    dataset = { ...dataset, fetchedAt, prices, firstTradeDate: prices[0]?.tradeDate ?? null, lastTradeDate: prices.at(-1)?.tradeDate ?? null, recordCount: prices.length, status: stale(prices.at(-1)?.tradeDate ?? null) ? 'stale' : prices.length >= this.options.targetDays ? 'official' : 'partial', warnings: [...new Set(warnings)] }
    const validation = validateHistoryDataset(dataset, security.symbol)
    if (!validation.valid) throw new Error(`VALIDATION_ERROR: ${validation.errors.slice(0, 3).join('; ')}`)
    if (!prices.length) throw new Error('NO_DATA: TWSE 沒有可用歷史行情')
    if (!this.options.dryRun) await atomicWriteJson(path.join(this.stockDirectory, `${security.symbol}.json`), dataset)
    return { dataset, skipped: false }
  }

  async run(): Promise<HistoryBatchSummary> {
    const startedAt = new Date().toISOString(); await mkdir(this.stockDirectory, { recursive: true })
    const { securities, latestTradeDate } = await this.loadUniverse(); const datasets = await this.loadDatasets(securities)
    const previous = await readJson<HistoryProgress | null>(this.progressPath, null); const selected = this.selectSymbols(securities, datasets, previous)
    const failures: HistoryFailure[] = []; let updated = 0; let skipped = 0; let lastProcessed: string | null = null
    console.log(`[history] 批次 ${selected.length} 檔；目標 ${this.options.targetDays} 個實際交易日。`)
    for (let offset = 0; offset < selected.length; offset += this.options.batchSize) {
      const batch = selected.slice(offset, offset + this.options.batchSize)
      for (const security of batch) {
        lastProcessed = security.symbol
        try {
          const result = await this.syncSecurity(security, datasets.get(security.symbol), latestTradeDate); datasets.set(security.symbol, result.dataset)
          result.skipped ? skipped += 1 : updated += 1
          console.log(`[history] ${security.symbol} ${result.dataset.name}: ${result.dataset.recordCount} 日，${result.dataset.firstTradeDate} ~ ${result.dataset.lastTradeDate}，${result.dataset.status}`)
        } catch (error) {
          const failure = { symbol: security.symbol, category: categorizeHistoryError(error), message: error instanceof Error ? error.message : String(error), attempts: this.options.maxRetries + 1, occurredAt: new Date().toISOString() } satisfies HistoryFailure
          failures.push(failure); console.error(`[history] ${security.symbol} 失敗 [${failure.category}] ${failure.message}`)
        }
        if (!this.options.dryRun) { const interim = buildHistoryManifest(securities, datasets, failures, this.options.targetDays, this.options.technicalMinimumDays); await atomicWriteJson(this.progressPath, buildProgress(interim, startedAt, lastProcessed, 'running')) }
      }
      if (offset + this.options.batchSize < selected.length && this.options.batchDelay > 0) await new Promise((resolve) => setTimeout(resolve, this.options.batchDelay))
    }
    const manifest = buildHistoryManifest(securities, datasets, failures, this.options.targetDays, this.options.technicalMinimumDays)
    const summary: HistoryBatchSummary = { schemaVersion: 'history-backfill-summary-v1', startedAt, completedAt: new Date().toISOString(), requested: selected.length, updated, skipped, failed: failures.length, partial: selected.filter((item) => (datasets.get(item.symbol)?.recordCount ?? 0) < this.options.targetDays).length, complete: selected.filter((item) => (datasets.get(item.symbol)?.recordCount ?? 0) >= this.options.targetDays).length, totalCommonStocks: manifest.summary.commonStocks, selectedSymbols: selected.map((item) => item.symbol), failures, targetTradingDays: this.options.targetDays, dryRun: this.options.dryRun }
    if (!this.options.dryRun) { await atomicWriteJson(this.manifestPath, manifest); await atomicWriteJson(this.progressPath, buildProgress(manifest, startedAt, lastProcessed, failures.length ? 'partial' : 'completed')); await atomicWriteJson(this.reportPath, summary) }
    console.log(`[history] 完成：更新 ${updated}、略過 ${skipped}、失敗 ${failures.length}；有效 ${manifest.summary.officialValid}/${manifest.summary.commonStocks}。`)
    return summary
  }
}
