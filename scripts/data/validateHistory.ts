import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { atomicWriteJson, buildHistoryManifest, buildProgress, readJson } from './history/HistoryManifestWriter.ts'
import type { HistoryProgress } from './history/types.ts'
import { sanitizeHistoryPoints, validateHistoryDataset } from './history/HistoryValidator.ts'
import type { HistoryFailure, HistorySecurity, TwseHistoryDataset } from './history/types.ts'

const root = process.cwd()
const stockDir = path.join(root, 'public', 'data', 'twse-stock-history', 'stocks')
const universe = await readJson<{ records?: Array<{ symbol: string; name: string; instrumentType: string }> }>(path.join(root, 'public', 'data', 'twse-stocks', 'latest.json'), {})
const securities: HistorySecurity[] = (universe.records ?? []).map((item) => ({ symbol: item.symbol, name: item.name, instrumentType: item.instrumentType ?? 'unknown' }))
const datasets = new Map<string, TwseHistoryDataset>(); const failures: HistoryFailure[] = []; let normalizedRows = 0
for (const file of (await readdir(stockDir).catch(() => [])).filter((item) => /^\d{4}\.json$/.test(item)).sort()) {
  const symbol = file.slice(0, 4)
  try {
    const original = await readJson<TwseHistoryDataset | null>(path.join(stockDir, file), null)
    if (!original) continue
    const sanitized = sanitizeHistoryPoints(original.prices)
    normalizedRows += sanitized.rejected
    const dataset: TwseHistoryDataset = sanitized.rejected ? { ...original, prices: sanitized.points, recordCount: sanitized.points.length, firstTradeDate: sanitized.points[0]?.tradeDate ?? null, lastTradeDate: sanitized.points.at(-1)?.tradeDate ?? null, status: sanitized.points.length >= 300 ? 'official' : 'partial', fetchedAt: new Date().toISOString(), warnings: [...new Set([...(original.warnings ?? []), `排除 ${sanitized.rejected} 筆缺少有效 OHLC 的 TWSE 原始列；未以 0 或模擬值補入`])] } : original
    if (sanitized.rejected) await atomicWriteJson(path.join(stockDir, file), dataset)
    const result = validateHistoryDataset(dataset, symbol)
    if (!result.valid) failures.push({ symbol, category: 'VALIDATION_ERROR', message: result.errors.join('; '), attempts: 0, occurredAt: new Date().toISOString() })
    else datasets.set(symbol, dataset)
  } catch (error) { failures.push({ symbol, category: 'PARSE_ERROR', message: error instanceof Error ? error.message : String(error), attempts: 0, occurredAt: new Date().toISOString() }) }
}
const manifest = buildHistoryManifest(securities, datasets, failures, 300, 120)
const technical = await readJson<{ records?: Array<Record<string, unknown>> }>(path.join(root, 'public', 'data', 'technical-index', 'latest.json'), {})
const technicalBySymbol = new Map((technical.records ?? []).map((item) => [String(item.symbol), item]))
const symbols = manifest.items.filter((item) => item.isOfficial && item.path).map((item) => {
  const dataset = datasets.get(item.symbol) as TwseHistoryDataset; const row = technicalBySymbol.get(item.symbol)
  return { symbol: item.symbol, name: item.name, path: item.path, firstTradeDate: item.firstDate, lastTradeDate: item.lastDate, recordCount: item.recordCount, status: dataset.status, stale: dataset.status === 'stale', warnings: dataset.warnings, technical: { aboveMa20: typeof row?.aboveMa20 === 'boolean' ? row.aboveMa20 : null, rsiOverbought: typeof row?.rsi14 === 'number' ? row.rsi14 >= 70 : null, macdGoldenCross: typeof row?.macdCrossDays === 'number', volumeExpansion: typeof row?.volumeRatio === 'number' ? row.volumeRatio >= 1.5 : null, indicatorComputable: item.technicalDataReady } }
  }).sort((left, right) => left.symbol.localeCompare(right.symbol))
const technicalItems = symbols.filter((item) => item.technical.indicatorComputable)
const normalizedRowsTotal = [...datasets.values()].reduce((sum, dataset) => sum + dataset.warnings.reduce((subtotal, warning) => subtotal + (Number(warning.match(/排除 (\d+) 筆缺少有效 OHLC/)?.[1] ?? 0)), 0), 0)
const index = { schemaVersion: '1.0', source: 'TWSE', updatedAt: manifest.updatedAt, targetTradingDays: 300, symbols, summary: { availableSymbols: symbols.length, averageRecordCount: symbols.length ? Math.round(symbols.reduce((sum, item) => sum + item.recordCount, 0) / symbols.length) : 0, complete250Count: symbols.filter((item) => item.recordCount >= 250).length, complete300Count: symbols.filter((item) => item.recordCount >= 300).length, staleCount: symbols.filter((item) => item.stale).length, failedSymbols: failures.map((item) => item.symbol), technicalSampleSize: technicalItems.length, aboveMa20Count: technicalItems.filter((item) => item.technical.aboveMa20).length, rsiOverboughtCount: technicalItems.filter((item) => item.technical.rsiOverbought).length, macdGoldenCrossCount: technicalItems.filter((item) => item.technical.macdGoldenCross).length, volumeExpansionCount: technicalItems.filter((item) => item.technical.volumeExpansion).length } }
const report = { schemaVersion: 'history-validation-summary-v1', generatedAt: manifest.updatedAt, totalFiles: datasets.size + failures.length, validFiles: datasets.size, invalidFiles: failures.length, normalizedRowsThisRun: normalizedRows, normalizedRowsTotal, totalSecurities: manifest.summary.totalSecurities, eligibleCommonStocks: manifest.summary.eligibleCommonStocks, unsupportedSecurities: manifest.summary.unsupportedSecurities, complete: manifest.summary.complete, complete300: manifest.summary.complete, partial: manifest.summary.partial, pending: manifest.summary.pending, failed: manifest.summary.failed, commonStocks: manifest.summary.commonStocks, unsupported: manifest.summary.unsupported, technicalEligible: manifest.summary.technicalEligible, technicalReady: manifest.summary.technicalReady, coverageInvariantValid: manifest.summary.coverageInvariantValid, errors: failures }
if (!manifest.summary.coverageInvariantValid) throw new Error(`Coverage invariant failed: ${manifest.summary.complete} + ${manifest.summary.partial} + ${manifest.summary.pending} + ${manifest.summary.failed} !== ${manifest.summary.eligibleCommonStocks}`)
await atomicWriteJson(path.join(root, 'public', 'data', 'history', 'history-manifest.json'), manifest)
const priorProgress = await readJson<HistoryProgress | null>(path.join(root, 'data', 'history', 'history-progress.json'), null)
const refreshedProgress = buildProgress(manifest, priorProgress?.startedAt ?? manifest.updatedAt, priorProgress?.lastProcessedSymbol ?? null, priorProgress?.status ?? 'idle')
await atomicWriteJson(path.join(root, 'data', 'history', 'history-progress.json'), { ...refreshedProgress, ...(priorProgress?.phase ? { phase: priorProgress.phase } : {}), ...(priorProgress?.plannedSymbols ? { plannedSymbols: priorProgress.plannedSymbols, phaseCompletedSymbols: priorProgress.plannedSymbols.filter((symbol) => datasets.has(symbol)) } : {}) })
await atomicWriteJson(path.join(root, 'public', 'data', 'twse-stock-history', 'index.json'), index)
await atomicWriteJson(path.join(root, 'public', 'data', 'twse-stock-history', 'latest.json'), index)
await atomicWriteJson(path.join(root, 'reports', 'history-validation-summary.json'), report)
console.log(`[history:validate] 有效 ${datasets.size} 檔；300 日完整 ${manifest.summary.complete}；部分 ${manifest.summary.partial}；隔離無效 ${failures.length}；排除無價格列 ${normalizedRows}。`)
