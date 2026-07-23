import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { atomicWriteJson, readJson } from './history/HistoryManifestWriter.ts'
import type { HistoryFailureCategory, HistoryManifest, HistoryProgress, TwseHistoryDataset } from './history/types.ts'

const option = (name: string, fallback: number) => {
  const item = process.argv.slice(2).find((value) => value.startsWith(`${name}=`))
  const parsed = Number(item?.slice(name.length + 1))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const textOption = (name: string) => process.argv.slice(2).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1) ?? ''

const directorySize = async (directory: string) => {
  let bytes = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name)
    bytes += entry.isDirectory() ? await directorySize(item) : entry.isFile() ? (await stat(item)).size : 0
  }
  return bytes
}

const root = process.cwd()
const reportPath = path.join(root, 'reports', 'history-backfill-summary.json')
const progressPath = path.join(root, 'data', 'history', 'history-progress.json')
const report = await readJson<Record<string, unknown>>(reportPath, {})
const progress = await readJson<HistoryProgress | null>(progressPath, null)
const manifest = await readJson<HistoryManifest | null>(path.join(root, 'public', 'data', 'history', 'history-manifest.json'), null)
const technical = await readJson<{ records?: Array<{ symbol: string; technicalScore: number | null }> }>(path.join(root, 'public', 'data', 'technical-index', 'latest.json'), {})
if (!manifest) throw new Error('找不到可結算的 Manifest')

const reportSymbols = Array.isArray(report.selectedSymbols) ? report.selectedSymbols.map(String) : []
const additionalSymbols = textOption('--additional-symbols').split(',').filter((symbol) => /^\d{4}$/.test(symbol))
const planned = [...new Set([...(progress?.plannedSymbols ?? []), ...additionalSymbols, ...reportSymbols])].sort((left, right) => left.localeCompare(right))
if (!planned.length) throw new Error('找不到可結算的 Phase 股票計畫')
const itemBySymbol = new Map(manifest.items.map((item) => [item.symbol, item]))
const technicalBySymbol = new Map((technical.records ?? []).map((item) => [item.symbol, item]))
const datasets = new Map<string, TwseHistoryDataset>()
for (const symbol of planned) {
  const dataset = await readJson<TwseHistoryDataset | null>(path.join(root, 'public', 'data', 'twse-stock-history', 'stocks', `${symbol}.json`), null)
  if (dataset) datasets.set(symbol, dataset)
}
const successful = planned.filter((symbol) => ['complete', 'partial'].includes(itemBySymbol.get(symbol)?.status ?? ''))
const complete = planned.filter((symbol) => itemBySymbol.get(symbol)?.status === 'complete').length
const partial = planned.filter((symbol) => itemBySymbol.get(symbol)?.status === 'partial').length
const failed = planned.filter((symbol) => itemBySymbol.get(symbol)?.status === 'failed' || !datasets.has(symbol)).length
const historicalRecordsAdded = planned.reduce((sum, symbol) => sum + (datasets.get(symbol)?.recordCount ?? 0), 0)
const technicalSuccess = planned.filter((symbol) => Number.isFinite(technicalBySymbol.get(symbol)?.technicalScore)).length
const noDataCount = planned.reduce((sum, symbol) => sum + (datasets.get(symbol)?.warnings.filter((warning) => warning.includes('無官方交易資料')).length ?? 0), 0)
const originalCounts = (report.errorCounts ?? {}) as Partial<Record<HistoryFailureCategory, number>>
const errorCounts: Record<HistoryFailureCategory, number> = { RATE_LIMIT: originalCounts.RATE_LIMIT ?? 0, NETWORK_ERROR: originalCounts.NETWORK_ERROR ?? 0, INVALID_RESPONSE: originalCounts.INVALID_RESPONSE ?? 0, NO_DATA: noDataCount, PARSE_ERROR: originalCounts.PARSE_ERROR ?? 0, VALIDATION_ERROR: originalCounts.VALIDATION_ERROR ?? 0, UNKNOWN: originalCounts.UNKNOWN ?? 0 }
const additionalExecutionMs = option('--additional-execution-ms', 0)
const totalExecutionMs = Number(report.totalExecutionMs ?? 0) + additionalExecutionMs
const historyFilesBytesBefore = option('--history-bytes-before', Number(report.historyFilesBytesBefore ?? 0))
const manifestBytesBefore = option('--manifest-bytes-before', 0)
const stockDirectory = path.join(root, 'public', 'data', 'twse-stock-history', 'stocks')
const historyFilesBytesAfter = await directorySize(stockDirectory)
const manifestBytes = (await stat(path.join(root, 'public', 'data', 'history', 'history-manifest.json'))).size
const assetDirectory = path.join(root, 'dist', 'assets')
const assetNames = await readdir(assetDirectory).catch(() => [])
const currentEntryName = assetNames.find((name) => /^index-[\w-]+\.js$/.test(name))
const currentDashboardName = assetNames.find((name) => /^Dashboard-[\w-]+\.js$/.test(name))
const currentEntryBytes = currentEntryName ? (await stat(path.join(assetDirectory, currentEntryName))).size : 0
const currentDashboardBytes = currentDashboardName ? (await stat(path.join(assetDirectory, currentDashboardName))).size : 0
const baselineEntryBytes = option('--baseline-entry-bytes', currentEntryBytes)
const baselineDashboardBytes = option('--baseline-dashboard-bytes', currentDashboardBytes)
const partialDetails = planned.filter((symbol) => itemBySymbol.get(symbol)?.status === 'partial').map((symbol) => {
  const dataset = datasets.get(symbol)
  return { symbol, recordCount: dataset?.recordCount ?? 0, firstTradeDate: dataset?.firstTradeDate ?? null, lastTradeDate: dataset?.lastTradeDate ?? null, reason: '本次月份範圍內 TWSE 官方端點可取得的有效交易日不足 300；已記錄並停止，不自動重抓。', warnings: dataset?.warnings ?? [] }
})
const totalRetries = Number(report.totalRetries ?? 0)
const finalized = {
  ...report,
  phase: progress?.phase ?? report.phase,
  requested: planned.length,
  updated: successful.length,
  complete,
  partial,
  failed,
  selectedSymbols: planned,
  totalRetries,
  errorCounts,
  averageStockDurationMs: planned.length ? Math.round(totalExecutionMs / planned.length) : 0,
  totalExecutionMs,
  historicalRecordsAdded,
  historyFilesBytesBefore,
  historyFilesBytesAfter,
  historyFilesBytesDelta: historyFilesBytesAfter - historyFilesBytesBefore,
  manifestBytes,
  repositoryPayloadBytesDelta: historyFilesBytesAfter - historyFilesBytesBefore + manifestBytes - manifestBytesBefore,
  gitRepositorySizeDeltaBytes: 0,
  projectedGitPayloadDeltaBytes: historyFilesBytesAfter - historyFilesBytesBefore + manifestBytes - manifestBytesBefore,
  executionSegments: Number(report.executionSegments ?? 1) + (additionalExecutionMs > 0 ? 1 : 0),
  technical: { success: technicalSuccess, failed: planned.length - technicalSuccess },
  buildTimeMs: option('--build-time-ms', Number(report.buildTimeMs ?? 0)),
  pagesInitialLoadImpact: { baselineEntryBytes, currentEntryBytes, entryDeltaBytes: currentEntryBytes - baselineEntryBytes, baselineDashboardBytes, currentDashboardBytes, dashboardDeltaBytes: currentDashboardBytes - baselineDashboardBytes, historyJsonEagerLoaded: false, conclusion: 'Phase 2 股票歷史 JSON 為個股頁按需載入，不加入首頁初始下載。' },
  partialDetails,
  notes: ['Phase 2 固定計畫 100 檔；未啟動 Phase 3。', '執行期間曾因 Windows 暫時鎖定 checkpoint 中斷一次，依 plannedSymbols 原清單續跑，未擴大範圍。', 'gitRepositorySizeDeltaBytes 為 0，因本次未 commit 或 push；projectedGitPayloadDeltaBytes 為資料若提交後的工作樹 payload 增量。'],
}
await atomicWriteJson(reportPath, finalized)
if (progress) await atomicWriteJson(progressPath, { ...progress, phase: String(finalized.phase ?? 'manual-backfill'), plannedSymbols: planned, phaseCompletedSymbols: successful })
console.log(`[history:finalize] ${successful.length}/${planned.length} 成功；完整 ${complete}、部分 ${partial}、失敗 ${failed}；Technical ${technicalSuccess}/${planned.length}。`)
