import { randomInt } from 'node:crypto'
import path from 'node:path'
import { atomicWriteJson, readJson } from './history/HistoryManifestWriter.ts'
import { validateHistoryDataset } from './history/HistoryValidator.ts'
import type { HistoryManifest, TwseHistoryDataset } from './history/types.ts'

interface BackfillReport { phase?: string; selectedSymbols?: string[] }
interface TechnicalIndex { records?: Array<{ symbol: string; tradeDate: string | null }> }

const root = process.cwd()
const report = await readJson<BackfillReport>(path.join(root, 'reports', 'history-backfill-summary.json'), {})
const manifest = await readJson<HistoryManifest | null>(path.join(root, 'public', 'data', 'history', 'history-manifest.json'), null)
const technical = await readJson<TechnicalIndex>(path.join(root, 'public', 'data', 'technical-index', 'latest.json'), {})
if (!manifest) throw new Error('History Manifest 不存在')

const manifestBySymbol = new Map(manifest.items.map((item) => [item.symbol, item]))
const pool = [...new Set(report.selectedSymbols ?? [])].filter((symbol) => {
  const status = manifestBySymbol.get(symbol)?.status
  return status === 'complete' || status === 'partial'
})
const shuffled = [...pool]
for (let index = shuffled.length - 1; index > 0; index -= 1) {
  const swap = randomInt(index + 1); [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]]
}
const sampledSymbols = shuffled.slice(0, Math.min(10, shuffled.length))
if (sampledSymbols.length < Math.min(10, pool.length)) throw new Error('抽查樣本不足')

const technicalBySymbol = new Map((technical.records ?? []).map((item) => [item.symbol, item]))
const checks = []
for (const symbol of sampledSymbols) {
  const filename = `${symbol}.json`
  const dataset = await readJson<TwseHistoryDataset | null>(path.join(root, 'public', 'data', 'twse-stock-history', 'stocks', filename), null)
  const item = manifestBySymbol.get(symbol); const technicalItem = technicalBySymbol.get(symbol)
  const dates = dataset?.prices.map((point) => point.tradeDate) ?? []
  const uniqueDates = new Set(dates)
  const ascending = dates.every((date, index) => index === 0 || dates[index - 1] < date)
  const validation = dataset ? validateHistoryDataset(dataset, symbol) : { valid: false, errors: ['資料不存在'], warnings: [] }
  const result = {
    symbol,
    filename,
    symbolMatchesFilename: dataset?.symbol === symbol,
    noDuplicateDates: uniqueDates.size === dates.length,
    ascendingDates: ascending,
    validOhlc: validation.valid,
    recordCountMatchesManifest: dataset?.recordCount === item?.recordCount,
    technicalLatestDateMatchesHistory: technicalItem?.tradeDate === dataset?.lastTradeDate,
    recordCount: dataset?.recordCount ?? 0,
    latestDate: dataset?.lastTradeDate ?? null,
    errors: validation.errors,
  }
  checks.push(result)
}

const passed = checks.filter((item) => item.symbolMatchesFilename && item.noDuplicateDates && item.ascendingDates && item.validOhlc && item.recordCountMatchesManifest && item.technicalLatestDateMatchesHistory).length
const output = { schemaVersion: 'history-phase-audit-v1', phase: report.phase ?? 'unknown', generatedAt: new Date().toISOString(), sampleMethod: 'cryptographically shuffled without replacement', requestedSampleSize: 10, sampledSymbols, passed, failed: checks.length - passed, checks }
await atomicWriteJson(path.join(root, 'reports', 'history-backfill-audit.json'), output)
console.log(`[history:audit] ${passed}/${checks.length} 檔通過隨機抽查。`)
if (passed !== checks.length) process.exitCode = 1
