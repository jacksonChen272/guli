import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { resolvePlannedSymbols, selectPendingHistoryBatch, validateHistoryCoverage } from './HistoryAutomation.ts'
import { TwseHistoryFetcher, TWSE_HISTORY_ENDPOINT, buildMonthKeys } from './TwseHistoryFetcher.ts'
import { categorizeHistoryError, HistoryRetryQueue } from './HistoryRetryQueue.ts'
import { HistoryRateLimiter } from './HistoryRateLimiter.ts'
import { mergeHistoryPoints, sanitizeHistoryPoints, synchronizeHistoryMetadata, validateHistoryDataset } from './HistoryValidator.ts'
import { atomicWriteJson, buildHistoryManifest, buildProgress, readJson } from './HistoryManifestWriter.ts'
import type {
  HistoryCoverageCounts,
  HistoryFailure,
  HistoryFailureCategory,
  HistoryManifest,
  HistoryProgress,
  HistorySecurity,
  TwseHistoryDataset,
} from './types.ts'

export interface HistoryBatchOptions {
  root: string
  batchSize: number
  limit: number
  executionLimit?: number | null
  startSymbol: string | null
  symbols: string[]
  startMonth: string | null
  targetDays: number
  technicalMinimumDays: number
  requestDelay: number
  batchDelay: number
  maxRetries: number
  forceRefresh: boolean
  retryFailedOnly: boolean
  dryRun: boolean
  planOnly?: boolean
  incremental: boolean
  timeout: number
  phase: string
  partialRefetchReason: string | null
}

export interface HistoryBatchSummary {
  schemaVersion: 'history-backfill-summary-v1'
  phase: string
  status: HistoryProgress['status']
  startedAt: string
  completedAt: string
  requested: number
  executed: number
  updated: number
  skipped: number
  failed: number
  partial: number
  complete: number
  totalCommonStocks: number
  selectedSymbols: string[]
  executedSymbols: string[]
  failures: HistoryFailure[]
  targetTradingDays: number
  dryRun: boolean
  planOnly: boolean
  partialRefetchReason: string | null
  totalRetries: number
  errorCounts: Record<HistoryFailureCategory, number>
  averageStockDurationMs: number
  totalExecutionMs: number
  historicalRecordsAdded: number
  historyFilesBytesBefore: number
  historyFilesBytesAfter: number
  historyFilesBytesDelta: number
  manifestBytes: number
  repositoryPayloadBytesDelta: number
  coverageBefore: HistoryCoverageCounts
  coverageAfter: HistoryCoverageCounts
}

interface InstrumentedFetcher {
  fetchMonth: TwseHistoryFetcher['fetchMonth']
  getMetrics?: () => { totalRetries: number; errorCounts: Record<HistoryFailureCategory, number> }
}

const emptyErrorCounts = (): Record<HistoryFailureCategory, number> => ({
  RATE_LIMIT: 0,
  NETWORK_ERROR: 0,
  INVALID_RESPONSE: 0,
  NO_DATA: 0,
  PARSE_ERROR: 0,
  VALIDATION_ERROR: 0,
  WRITE_ERROR: 0,
  UNKNOWN: 0,
})

function addErrorCounts(left: Record<HistoryFailureCategory, number>, right: Record<HistoryFailureCategory, number>) {
  const result = emptyErrorCounts()
  for (const key of Object.keys(result) as HistoryFailureCategory[]) result[key] = (left[key] ?? 0) + (right[key] ?? 0)
  return result
}

async function directorySize(directory: string): Promise<number> {
  let bytes = 0
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const item = path.join(directory, entry.name)
    if (entry.isDirectory()) bytes += await directorySize(item)
    else if (entry.isFile()) bytes += (await stat(item)).size
  }
  return bytes
}

const fileSize = async (file: string) => (await stat(file).catch(() => null))?.size ?? 0

const defaultDataset = (symbol: string, name: string): TwseHistoryDataset => ({
  schemaVersion: '1.0',
  symbol,
  name,
  market: 'TWSE',
  source: 'TWSE',
  sourceUrl: TWSE_HISTORY_ENDPOINT,
  fetchedAt: new Date(0).toISOString(),
  firstTradeDate: null,
  lastTradeDate: null,
  recordCount: 0,
  status: 'partial',
  warnings: [],
  prices: [],
})

const isStale = (date: string | null) => !date || (Date.now() - Date.parse(`${date}T00:00:00Z`)) / 86_400_000 > 7

function coverageFromManifest(manifest: HistoryManifest, technicalDataReady = manifest.summary.technicalReady): HistoryCoverageCounts {
  return {
    totalSecurities: manifest.summary.totalSecurities,
    eligibleCommonStocks: manifest.summary.eligibleCommonStocks,
    unsupportedSecurities: manifest.summary.unsupportedSecurities,
    complete: manifest.summary.complete,
    partial: manifest.summary.partial,
    pending: manifest.summary.pending,
    failed: manifest.summary.failed,
    technicalDataReady,
  }
}

export class HistoryBatchRunner {
  private readonly options: HistoryBatchOptions
  private readonly stockDirectory: string
  private readonly manifestPath: string
  private readonly progressPath: string
  private readonly reportPath: string
  private readonly fetcher: InstrumentedFetcher

  constructor(options: HistoryBatchOptions, fetcher?: InstrumentedFetcher) {
    this.options = options
    this.stockDirectory = path.join(options.root, 'public', 'data', 'twse-stock-history', 'stocks')
    this.manifestPath = path.join(options.root, 'public', 'data', 'history', 'history-manifest.json')
    this.progressPath = path.join(options.root, 'data', 'history', 'history-progress.json')
    this.reportPath = path.join(options.root, 'reports', 'history-backfill-summary.json')
    this.fetcher = fetcher ?? new TwseHistoryFetcher(
      fetch,
      new HistoryRateLimiter(options.requestDelay, options.batchDelay),
      new HistoryRetryQueue(options.maxRetries),
      options.timeout,
    )
  }

  async loadUniverse(): Promise<{ securities: HistorySecurity[]; latestTradeDate: string | null }> {
    const source = await readJson<{ tradeDate?: string; records?: Array<{ symbol: string; name: string; instrumentType: string }> }>(
      path.join(this.options.root, 'public', 'data', 'twse-stocks', 'latest.json'),
      {},
    )
    return {
      securities: (source.records ?? []).map((item) => ({ symbol: item.symbol, name: item.name, instrumentType: item.instrumentType ?? 'unknown' })),
      latestTradeDate: source.tradeDate ?? null,
    }
  }

  async loadDatasets(securities: HistorySecurity[]): Promise<Map<string, TwseHistoryDataset>> {
    const allowed = new Set(securities.map((item) => item.symbol))
    const datasets = new Map<string, TwseHistoryDataset>()
    const files = await readdir(this.stockDirectory).catch(() => [])
    for (const file of files.filter((item) => /^\d{4}\.json$/.test(item))) {
      const symbol = file.slice(0, 4)
      if (!allowed.has(symbol)) continue
      const dataset = await readJson<TwseHistoryDataset | null>(path.join(this.stockDirectory, file), null)
      if (dataset) datasets.set(symbol, dataset)
    }
    return datasets
  }

  private async loadTechnicalReadyCount() {
    const technical = await readJson<{ scoreAvailableCount?: number; records?: unknown[] }>(
      path.join(this.options.root, 'public', 'data', 'technical-index', 'latest.json'),
      {},
    )
    return Number.isInteger(technical.scoreAvailableCount)
      ? technical.scoreAvailableCount as number
      : Array.isArray(technical.records) ? technical.records.length : 0
  }

  selectSymbols(
    securities: HistorySecurity[],
    datasets: Map<string, TwseHistoryDataset>,
    manifestOrProgress: HistoryManifest | HistoryProgress | null,
    suppliedProgress?: HistoryProgress | null,
  ): HistorySecurity[] {
    const manifest = manifestOrProgress && 'items' in manifestOrProgress
      ? manifestOrProgress
      : buildHistoryManifest(securities, datasets, manifestOrProgress?.failedSymbols ?? [], this.options.targetDays, this.options.technicalMinimumDays)
    const previous = manifestOrProgress && 'items' in manifestOrProgress ? suppliedProgress ?? null : manifestOrProgress
    const common = securities
      .filter((item) => item.instrumentType === 'stock' && /^\d{4}$/.test(item.symbol))
      .sort((left, right) => left.symbol.localeCompare(right.symbol))
    const bySymbol = new Map(common.map((item) => [item.symbol, item]))
    const activePlan = previous?.phase === this.options.phase
      && previous.status !== 'completed'
      && previous.plannedSymbols?.length
      ? previous.plannedSymbols
      : null

    if (activePlan && !this.options.incremental) {
      return activePlan.map((symbol) => bySymbol.get(symbol)).filter((item): item is HistorySecurity => Boolean(item))
    }

    if (previous?.phase === this.options.phase && previous.status === 'completed' && !this.options.forceRefresh && !this.options.symbols.length && !this.options.incremental) return []

    let rows = this.options.symbols.length ? common.filter((item) => this.options.symbols.includes(item.symbol)) : common
    if (this.options.startSymbol) rows = rows.filter((item) => item.symbol.localeCompare(this.options.startSymbol as string) >= 0)

    if (this.options.incremental) {
      rows = rows.filter((item) => {
        const dataset = datasets.get(item.symbol)
        return Boolean(dataset && validateHistoryDataset(dataset, item.symbol).valid)
      })
      return rows.slice(0, this.options.limit)
    }

    if (this.options.retryFailedOnly) {
      const failed = new Set(previous?.failedSymbols.map((item) => item.symbol) ?? [])
      return rows.filter((item) => failed.has(item.symbol)).slice(0, this.options.limit)
    }

    if (this.options.symbols.length) return rows.slice(0, this.options.limit)

    if (this.options.partialRefetchReason) {
      const partial = new Set(manifest.items.filter((item) => item.status === 'partial').map((item) => item.symbol))
      return rows.filter((item) => partial.has(item.symbol)).slice(0, this.options.limit)
    }

    const selected = new Set(selectPendingHistoryBatch(manifest.items, this.options.limit).map((item) => item.symbol))
    return rows.filter((item) => selected.has(item.symbol))
  }

  async syncSecurity(security: HistorySecurity, existing: TwseHistoryDataset | undefined, latestTradeDate: string | null) {
    if (!this.options.forceRefresh && existing && validateHistoryDataset(existing, security.symbol).valid && existing.recordCount >= this.options.targetDays && existing.lastTradeDate === latestTradeDate) {
      return { dataset: existing, skipped: true }
    }
    let dataset = existing ?? defaultDataset(security.symbol, security.name)
    const warnings = [...dataset.warnings]
    const requiredMonths = this.options.incremental
      ? 2
      : Math.min(48, Math.max(2, Math.ceil(Math.max(0, this.options.targetDays - dataset.prices.length) / 18) + 2))
    const firstDate = existing?.firstTradeDate
    const previousMonth = firstDate ? (() => {
      const date = new Date(`${firstDate.slice(0, 7)}-01T00:00:00Z`)
      date.setUTCMonth(date.getUTCMonth() - 1)
      return date.toISOString().slice(0, 7)
    })() : null
    const startMonth = this.options.startMonth ?? (!this.options.incremental ? previousMonth : null)

    for (const month of buildMonthKeys(startMonth, requiredMonths)) {
      try {
        const result = await this.fetcher.fetchMonth(security.symbol, month)
        dataset = { ...dataset, name: result.name || dataset.name, prices: mergeHistoryPoints(dataset.prices, result.points) }
        warnings.push(...result.warnings)
      } catch (error) {
        if (categorizeHistoryError(error) === 'NO_DATA') {
          warnings.push(`${month.slice(0, 6)} has no TWSE history data`)
          continue
        }
        throw error
      }
      if (!this.options.incremental && dataset.prices.length >= this.options.targetDays) break
    }

    const sanitized = sanitizeHistoryPoints(dataset.prices)
    if (sanitized.rejected) warnings.push(`Removed ${sanitized.rejected} invalid OHLC records; missing values were not fabricated`)
    const fetchedAt = new Date().toISOString()
    const prices = sanitized.points
    dataset = synchronizeHistoryMetadata({
      ...dataset,
      prices,
      status: isStale(prices.at(-1)?.tradeDate ?? null) ? 'stale' : prices.length >= this.options.targetDays ? 'official' : 'partial',
      warnings: [...new Set(warnings)],
    }, {
      symbol: security.symbol,
      name: dataset.name || security.name,
      fetchedAt,
    }).dataset
    const validation = validateHistoryDataset(dataset, security.symbol)
    if (!validation.valid) throw new Error(`VALIDATION_ERROR: ${validation.errors.slice(0, 3).join('; ')}`)
    if (!prices.length) throw new Error('NO_DATA: TWSE returned no valid history rows')
    if (!this.options.dryRun) await atomicWriteJson(path.join(this.stockDirectory, `${security.symbol}.json`), dataset)
    return { dataset, skipped: false }
  }

  async run(): Promise<HistoryBatchSummary> {
    const segmentStartedMs = Date.now()
    const now = new Date(segmentStartedMs).toISOString()
    await mkdir(this.stockDirectory, { recursive: true })
    const currentHistoryBytes = await directorySize(this.stockDirectory)
    const currentManifestBytes = await fileSize(this.manifestPath)
    const { securities, latestTradeDate } = await this.loadUniverse()
    const datasets = await this.loadDatasets(securities)
    const previous = await readJson<HistoryProgress | null>(this.progressPath, null)
    const previousFailures = previous?.phase === this.options.phase ? previous.failedSymbols : []
    const baseManifest = buildHistoryManifest(securities, datasets, previousFailures, this.options.targetDays, this.options.technicalMinimumDays)
    const technicalReady = await this.loadTechnicalReadyCount()
    const currentCoverage = coverageFromManifest(baseManifest, Math.min(technicalReady, baseManifest.summary.complete + baseManifest.summary.partial))
    const coverageCheck = validateHistoryCoverage(currentCoverage)
    if (!coverageCheck.valid) {
      const errorReport = { generatedAt: now, phase: this.options.phase, coverage: currentCoverage, errors: coverageCheck.errors }
      if (!this.options.dryRun) await atomicWriteJson(path.join(this.options.root, 'reports', 'history-coverage-error.json'), errorReport)
      throw new Error(`Coverage invariant failed: ${coverageCheck.errors.join('; ')}`)
    }

    const candidates = this.selectSymbols(securities, datasets, baseManifest, previous)
    const plannedSymbols = resolvePlannedSymbols(previous, this.options.phase, candidates.map((item) => item.symbol))
    const phaseStartedAt = previous?.phase === this.options.phase && previous.phaseStartedAt ? previous.phaseStartedAt : now
    const coverageBefore = previous?.phase === this.options.phase && previous.phaseCoverageBefore
      ? previous.phaseCoverageBefore
      : currentCoverage
    const historyFilesBytesBefore = previous?.phase === this.options.phase && typeof previous.phaseHistoryBytesBefore === 'number'
      ? previous.phaseHistoryBytesBefore
      : currentHistoryBytes
    const manifestBytesBefore = previous?.phase === this.options.phase && typeof previous.phaseManifestBytesBefore === 'number'
      ? previous.phaseManifestBytesBefore
      : currentManifestBytes
    const priorMetrics = previous?.phase === this.options.phase ? previous.phaseMetrics : undefined
    const planned = new Set(plannedSymbols)
    const cumulativeFailures = previousFailures.filter((failure) => planned.has(failure.symbol) && !datasets.has(failure.symbol))
    const failedSet = new Set(cumulativeFailures.map((failure) => failure.symbol))
    const remaining = candidates.filter((security) => planned.has(security.symbol) && !datasets.has(security.symbol) && !failedSet.has(security.symbol))
    const executionLimit = this.options.executionLimit ?? remaining.length
    const selected = remaining.slice(0, executionLimit)

    const initialMetrics = priorMetrics ?? {
      executionSegments: 0,
      processedSymbols: 0,
      updatedSymbols: 0,
      skippedSymbols: 0,
      historicalRecordsAdded: 0,
      totalExecutionMs: 0,
      totalRetries: 0,
      errorCounts: emptyErrorCounts(),
    }

    const buildSummary = async (status: HistoryProgress['status'], manifest: HistoryManifest, executedSymbols: string[], fetchRetries: number, fetchErrors: Record<HistoryFailureCategory, number>, segmentUpdated: number, segmentSkipped: number, segmentRecordsAdded: number) => {
      const phaseMetrics = {
        executionSegments: initialMetrics.executionSegments + (this.options.planOnly ? 0 : 1),
        processedSymbols: initialMetrics.processedSymbols + executedSymbols.length,
        updatedSymbols: initialMetrics.updatedSymbols + segmentUpdated,
        skippedSymbols: initialMetrics.skippedSymbols + segmentSkipped,
        historicalRecordsAdded: initialMetrics.historicalRecordsAdded + segmentRecordsAdded,
        totalExecutionMs: initialMetrics.totalExecutionMs + (this.options.planOnly ? 0 : Date.now() - segmentStartedMs),
        totalRetries: initialMetrics.totalRetries + fetchRetries,
        errorCounts: addErrorCounts(initialMetrics.errorCounts, fetchErrors),
      }
      const phaseItems = manifest.items.filter((item) => planned.has(item.symbol))
      const historyFilesBytesAfter = await directorySize(this.stockDirectory)
      const manifestBytes = await fileSize(this.manifestPath)
      const afterTechnicalReady = Math.min(await this.loadTechnicalReadyCount(), manifest.summary.complete + manifest.summary.partial)
      const coverageAfter = coverageFromManifest(manifest, afterTechnicalReady)
      return {
        summary: {
          schemaVersion: 'history-backfill-summary-v1',
          phase: this.options.phase,
          status,
          startedAt: phaseStartedAt,
          completedAt: new Date().toISOString(),
          requested: plannedSymbols.length,
          executed: phaseMetrics.processedSymbols,
          updated: phaseMetrics.updatedSymbols,
          skipped: phaseMetrics.skippedSymbols,
          failed: phaseItems.filter((item) => item.status === 'failed').length,
          partial: phaseItems.filter((item) => item.status === 'partial').length,
          complete: phaseItems.filter((item) => item.status === 'complete').length,
          totalCommonStocks: manifest.summary.eligibleCommonStocks,
          selectedSymbols: plannedSymbols,
          executedSymbols,
          failures: cumulativeFailures,
          targetTradingDays: this.options.targetDays,
          dryRun: this.options.dryRun,
          planOnly: this.options.planOnly ?? false,
          partialRefetchReason: this.options.partialRefetchReason,
          totalRetries: phaseMetrics.totalRetries,
          errorCounts: phaseMetrics.errorCounts,
          averageStockDurationMs: phaseMetrics.processedSymbols ? Math.round(phaseMetrics.totalExecutionMs / phaseMetrics.processedSymbols) : 0,
          totalExecutionMs: phaseMetrics.totalExecutionMs,
          historicalRecordsAdded: phaseMetrics.historicalRecordsAdded,
          historyFilesBytesBefore,
          historyFilesBytesAfter,
          historyFilesBytesDelta: historyFilesBytesAfter - historyFilesBytesBefore,
          manifestBytes,
          repositoryPayloadBytesDelta: historyFilesBytesAfter - historyFilesBytesBefore + manifestBytes - manifestBytesBefore,
          coverageBefore,
          coverageAfter,
        } satisfies HistoryBatchSummary,
        phaseMetrics,
      }
    }

    if (this.options.planOnly) {
      const { summary, phaseMetrics } = await buildSummary('running', baseManifest, [], 0, emptyErrorCounts(), 0, 0, 0)
      if (!this.options.dryRun) {
        const progress = buildProgress(baseManifest, phaseStartedAt, previous?.lastProcessedSymbol ?? null, 'running')
        await atomicWriteJson(this.progressPath, {
          ...progress,
          phase: this.options.phase,
          plannedSymbols,
          phaseCompletedSymbols: plannedSymbols.filter((symbol) => datasets.has(symbol)),
          phaseStartedAt,
          phaseHistoryBytesBefore: historyFilesBytesBefore,
          phaseManifestBytesBefore: manifestBytesBefore,
          phaseCoverageBefore: coverageBefore,
          phaseMetrics,
        })
        await atomicWriteJson(this.reportPath, summary)
      }
      console.log(`[history] plan ${this.options.phase}: locked ${plannedSymbols.length} pending common stocks`)
      return summary
    }

    let segmentUpdated = 0
    let segmentSkipped = 0
    let segmentProcessed = 0
    let segmentRecordsAdded = 0
    let lastProcessed = previous?.lastProcessedSymbol ?? null
    console.log(`[history] phase ${this.options.phase}: executing ${selected.length}/${plannedSymbols.length} planned symbols`)

    for (let offset = 0; offset < selected.length; offset += this.options.batchSize) {
      const batch = selected.slice(offset, offset + this.options.batchSize)
      for (const security of batch) {
        lastProcessed = security.symbol
        const beforeCount = datasets.get(security.symbol)?.recordCount ?? 0
        try {
          const result = await this.syncSecurity(security, datasets.get(security.symbol), latestTradeDate)
          datasets.set(security.symbol, result.dataset)
          result.skipped ? segmentSkipped += 1 : segmentUpdated += 1
          segmentRecordsAdded += Math.max(0, result.dataset.recordCount - beforeCount)
          console.log(`[history] ${security.symbol} ${result.dataset.name}: ${result.dataset.recordCount} rows (${result.dataset.status})`)
        } catch (error) {
          const failure = {
            symbol: security.symbol,
            category: categorizeHistoryError(error),
            message: error instanceof Error ? error.message : String(error),
            attempts: this.options.maxRetries + 1,
            occurredAt: new Date().toISOString(),
          } satisfies HistoryFailure
          cumulativeFailures.push(failure)
          failedSet.add(security.symbol)
          console.error(`[history] ${security.symbol} failed [${failure.category}] ${failure.message}`)
        }
        segmentProcessed += 1

        if (!this.options.dryRun) {
          const interim = buildHistoryManifest(securities, datasets, cumulativeFailures, this.options.targetDays, this.options.technicalMinimumDays)
          const progress = buildProgress(interim, phaseStartedAt, lastProcessed, 'running')
          const liveFetchMetrics = this.fetcher.getMetrics?.() ?? { totalRetries: 0, errorCounts: emptyErrorCounts() }
          const liveMetrics = {
            executionSegments: initialMetrics.executionSegments,
            processedSymbols: initialMetrics.processedSymbols + segmentProcessed,
            updatedSymbols: initialMetrics.updatedSymbols + segmentUpdated,
            skippedSymbols: initialMetrics.skippedSymbols + segmentSkipped,
            historicalRecordsAdded: initialMetrics.historicalRecordsAdded + segmentRecordsAdded,
            totalExecutionMs: initialMetrics.totalExecutionMs + Date.now() - segmentStartedMs,
            totalRetries: initialMetrics.totalRetries + liveFetchMetrics.totalRetries,
            errorCounts: addErrorCounts(initialMetrics.errorCounts, liveFetchMetrics.errorCounts),
          }
          await atomicWriteJson(this.manifestPath, interim)
          await atomicWriteJson(this.progressPath, {
            ...progress,
            phase: this.options.phase,
            plannedSymbols,
            phaseCompletedSymbols: plannedSymbols.filter((symbol) => datasets.has(symbol)),
            phaseStartedAt,
            phaseHistoryBytesBefore: historyFilesBytesBefore,
            phaseManifestBytesBefore: manifestBytesBefore,
            phaseCoverageBefore: coverageBefore,
            phaseMetrics: liveMetrics,
          })
        }
      }
      if (offset + this.options.batchSize < selected.length && this.options.batchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.options.batchDelay))
      }
    }

    const manifest = buildHistoryManifest(securities, datasets, cumulativeFailures, this.options.targetDays, this.options.technicalMinimumDays)
    const stillPending = plannedSymbols.filter((symbol) => !datasets.has(symbol) && !failedSet.has(symbol))
    const status: HistoryProgress['status'] = stillPending.length ? 'running' : cumulativeFailures.length ? 'partial' : 'completed'
    const fetchMetrics = this.fetcher.getMetrics?.() ?? { totalRetries: 0, errorCounts: emptyErrorCounts() }

    if (!this.options.dryRun) await atomicWriteJson(this.manifestPath, manifest)
    const { summary, phaseMetrics } = await buildSummary(
      status,
      manifest,
      selected.map((item) => item.symbol),
      fetchMetrics.totalRetries,
      fetchMetrics.errorCounts,
      segmentUpdated,
      segmentSkipped,
      segmentRecordsAdded,
    )
    if (!this.options.dryRun) {
      const progress = buildProgress(manifest, phaseStartedAt, lastProcessed, status)
      await atomicWriteJson(this.progressPath, {
        ...progress,
        phase: this.options.phase,
        plannedSymbols,
        phaseCompletedSymbols: plannedSymbols.filter((symbol) => datasets.has(symbol)),
        phaseStartedAt,
        phaseHistoryBytesBefore: historyFilesBytesBefore,
        phaseManifestBytesBefore: manifestBytesBefore,
        phaseCoverageBefore: coverageBefore,
        phaseMetrics,
      })
      await atomicWriteJson(this.reportPath, summary)
    }
    console.log(`[history] phase ${this.options.phase}: status=${status}, complete=${summary.complete}, partial=${summary.partial}, failed=${summary.failed}, pending=${stillPending.length}`)
    return summary
  }
}
