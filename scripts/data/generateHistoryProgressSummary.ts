import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  calculateHistoryProgress,
  evaluateHistoryPayload,
  validateHistoryCoverage,
} from './history/HistoryAutomation.ts'
import { atomicWriteJson, readJson } from './history/HistoryManifestWriter.ts'
import type { HistoryBatchSummary } from './history/HistoryBatchRunner.ts'
import type { HistoryCoverageCounts, HistoryManifest, HistoryProgress } from './history/types.ts'

interface TechnicalIndex { scoreAvailableCount?: number; records?: unknown[] }
interface TechnicalGenerationSummary { generated?: number; scoreAvailable?: number; failed?: number }

const root = process.cwd()
const stockDirectory = path.join(root, 'public', 'data', 'twse-stock-history', 'stocks')
const manifest = await readJson<HistoryManifest | null>(path.join(root, 'public', 'data', 'history', 'history-manifest.json'), null)
const progress = await readJson<HistoryProgress | null>(path.join(root, 'data', 'history', 'history-progress.json'), null)
const report = await readJson<Partial<HistoryBatchSummary>>(path.join(root, 'reports', 'history-backfill-summary.json'), {})
const technical = await readJson<TechnicalIndex>(path.join(root, 'public', 'data', 'technical-index', 'latest.json'), {})
const technicalGeneration = await readJson<TechnicalGenerationSummary>(path.join(root, 'reports', 'technical-generation-summary.json'), {})
if (!manifest) throw new Error('History manifest is missing')

const technicalDataReady = Number.isInteger(technical.scoreAvailableCount)
  ? technical.scoreAvailableCount as number
  : Array.isArray(technical.records) ? technical.records.length : 0
const coverage: HistoryCoverageCounts = {
  totalSecurities: manifest.summary.totalSecurities,
  eligibleCommonStocks: manifest.summary.eligibleCommonStocks,
  unsupportedSecurities: manifest.summary.unsupportedSecurities,
  complete: manifest.summary.complete,
  partial: manifest.summary.partial,
  pending: manifest.summary.pending,
  failed: manifest.summary.failed,
  technicalDataReady: Math.min(technicalDataReady, manifest.summary.complete + manifest.summary.partial),
}
const invariants = validateHistoryCoverage(coverage)
if (!invariants.valid) {
  const error = { generatedAt: new Date().toISOString(), coverage, errors: invariants.errors }
  await atomicWriteJson(path.join(root, 'reports', 'history-coverage-error.json'), error)
  throw new Error(`History coverage is invalid: ${invariants.errors.join('; ')}`)
}

const stockFiles = (await readdir(stockDirectory).catch(() => []))
  .filter((file) => /^\d{4}\.json$/.test(file))
  .sort()
const sizes = await Promise.all(stockFiles.map(async (file) => ({ symbol: file.slice(0, 4), bytes: (await stat(path.join(stockDirectory, file))).size })))
const totalHistoryBytes = sizes.reduce((sum, item) => sum + item.bytes, 0)
const largest = sizes.reduce<{ symbol: string | null; bytes: number }>((result, item) => item.bytes > result.bytes ? { symbol: item.symbol, bytes: item.bytes } : result, { symbol: null, bytes: 0 })
const technicalIndexBytes = (await stat(path.join(root, 'public', 'data', 'technical-index', 'latest.json')).catch(() => null))?.size ?? 0
const batchDeltaBytes = Math.max(0, report.historyFilesBytesDelta ?? 0)
const payload = {
  batchDeltaBytes,
  totalHistoryBytes,
  technicalIndexBytes,
  gitWorkingTreeDeltaBytes: Math.max(0, report.repositoryPayloadBytesDelta ?? batchDeltaBytes),
  largestStockFileBytes: largest.bytes,
  averageStockFileBytes: sizes.length ? Math.round(totalHistoryBytes / sizes.length) : 0,
  largestStockSymbol: largest.symbol,
}
const capacityGuard = evaluateHistoryPayload(payload)
const generatedAt = new Date().toISOString()
const lastUpdate = Date.parse(progress?.updatedAt ?? manifest.updatedAt)
const stale = !Number.isFinite(lastUpdate) || Date.now() - lastUpdate > 72 * 60 * 60 * 1_000
const publicSummary = {
  version: 'history-progress-summary-v1',
  schemaVersion: 'history-progress-summary-v1',
  generatedAt,
  updatedAt: progress?.updatedAt ?? manifest.updatedAt,
  source: 'TWSE Official History',
  phase: progress?.phase ?? report.phase ?? null,
  status: progress?.status ?? 'idle',
  stale,
  lastUpdatedAt: progress?.updatedAt ?? manifest.updatedAt,
  eligibleCommonStocks: coverage.eligibleCommonStocks,
  complete: coverage.complete,
  partial: coverage.partial,
  pending: coverage.pending,
  failed: coverage.failed,
  unsupported: coverage.unsupportedSecurities,
  technicalDataReady: coverage.technicalDataReady,
  coverage: calculateHistoryProgress(coverage),
  lastBatch: {
    planned: progress?.plannedSymbols?.length ?? report.requested ?? 0,
    processed: progress?.phaseMetrics?.processedSymbols ?? report.executed ?? 0,
    success: (report.complete ?? 0) + (report.partial ?? 0),
    complete: report.complete ?? 0,
    partial: report.partial ?? 0,
    failed: report.failed ?? 0,
    retries: progress?.phaseMetrics?.totalRetries ?? report.totalRetries ?? 0,
    errorCounts: progress?.phaseMetrics?.errorCounts ?? report.errorCounts ?? {},
    startedAt: progress?.phaseStartedAt ?? report.startedAt ?? null,
    completedAt: report.completedAt ?? null,
    durationMs: progress?.phaseMetrics?.totalExecutionMs ?? report.totalExecutionMs ?? 0,
    durationSeconds: Math.round((progress?.phaseMetrics?.totalExecutionMs ?? report.totalExecutionMs ?? 0) / 1_000),
    historicalRecordsAdded: progress?.phaseMetrics?.historicalRecordsAdded ?? report.historicalRecordsAdded ?? 0,
    newRecords: progress?.phaseMetrics?.historicalRecordsAdded ?? report.historicalRecordsAdded ?? 0,
  },
  capacity: {
    ...payload,
    maxBatchDeltaBytes: 20 * 1024 * 1024,
    maxStockFileBytes: 2 * 1024 * 1024,
    allowPullRequest: capacityGuard.allowPullRequest,
    warnings: capacityGuard.warnings,
    errors: capacityGuard.errors,
  },
  invariants: { valid: true, errors: [] as string[] },
}

await atomicWriteJson(path.join(root, 'public', 'data', 'history', 'history-progress-summary.json'), publicSummary)
await atomicWriteJson(path.join(root, 'reports', 'history-payload-summary.json'), { generatedAt, ...payload, ...capacityGuard })
await atomicWriteJson(path.join(root, 'reports', 'history-backfill-summary.json'), {
  ...report,
  coverageAfter: coverage,
  technical: {
    generated: technicalGeneration.generated ?? technicalDataReady,
    scoreAvailable: technicalGeneration.scoreAvailable ?? technicalDataReady,
    failed: technicalGeneration.failed ?? 0,
  },
})
console.log(`[history:coverage] complete=${coverage.complete}, partial=${coverage.partial}, pending=${coverage.pending}, failed=${coverage.failed}, technical=${coverage.technicalDataReady}`)
if (!capacityGuard.allowPullRequest) process.exitCode = 2
