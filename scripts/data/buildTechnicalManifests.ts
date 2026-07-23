import path from 'node:path'
import { atomicWriteJson, readJson } from './history/HistoryManifestWriter.ts'
import type { TwseHistoryDataset } from './history/types.ts'

interface TechnicalRecord { symbol: string; name: string; tradeDate: string | null; historyRecordCount: number; technicalScore: number | null }
interface TechnicalIndex { generatedAt: string; formulaVersion: string; records: TechnicalRecord[]; scoreAvailableCount: number }

const root = process.cwd()
const index = await readJson<TechnicalIndex>(path.join(root, 'public', 'data', 'technical-index', 'latest.json'), { generatedAt: new Date().toISOString(), formulaVersion: 'technical-v1.0', records: [], scoreAvailableCount: 0 })
const items = []
const currentBySymbol = new Map<string, TechnicalRecord>()
for (const record of index.records) {
  const dataset = await readJson<TwseHistoryDataset | null>(path.join(root, 'public', 'data', 'twse-stock-history', 'stocks', `${record.symbol}.json`), null)
  const scoreAvailable = record.technicalScore !== null && Number.isFinite(record.technicalScore)
  currentBySymbol.set(record.symbol, record)
  const errors = scoreAvailable ? [] : ['technical-v1.0 可用因子權重低於 50%']
  items.push({ symbol: record.symbol, name: record.name, status: !scoreAvailable ? 'failed' : record.historyRecordCount >= 300 ? 'complete' : 'partial', historyRecordCount: record.historyRecordCount, technicalRecordCount: record.historyRecordCount, latestTechnicalDate: record.tradeDate, scoreAvailable, errors })
}
const generatedAt = index.generatedAt || new Date().toISOString()
const gaps = []
for (const symbol of ['1213', '1341']) {
  const record = currentBySymbol.get(symbol)
  const dataset = await readJson<TwseHistoryDataset | null>(path.join(root, 'public', 'data', 'twse-stock-history', 'stocks', `${symbol}.json`), null)
  const missingFields = ['open', 'high', 'low', 'close', 'volume'].flatMap((field) => { const count = dataset?.prices.filter((point) => { const value = point[field as keyof typeof point]; return value === null || (typeof value === 'number' && !Number.isFinite(value)) }).length ?? 0; return count ? [{ field, count }] : [] })
  const repaired = record?.technicalScore !== null && Number.isFinite(record?.technicalScore)
  gaps.push({ symbol, name: record?.name ?? dataset?.name ?? symbol, historyRecordCount: record?.historyRecordCount ?? dataset?.recordCount ?? 0, missingFields, reason: '舊資料含缺少 OHLC 的 TWSE 無有效價格列，造成 technical-v1.0 可用因子不足。', repairable: true, result: repaired ? '已排除無有效價格列並成功產生 Technical Score；未補 0、未改公式。' : '等待該股票進入後續回補批次，排除無有效價格列後再重建；目前維持 Missing。', resolved: repaired })
}
await atomicWriteJson(path.join(root, 'public', 'data', 'technical', 'technical-manifest.json'), { schemaVersion: 'technical-manifest-v1', formulaVersion: index.formulaVersion, generatedAt, source: 'Derived from TWSE Official History', summary: { total: items.length, complete: items.filter((item) => item.status === 'complete').length, partial: items.filter((item) => item.status === 'partial').length, failed: items.filter((item) => item.status === 'failed').length, scoreAvailable: items.filter((item) => item.scoreAvailable).length }, items })
await atomicWriteJson(path.join(root, 'reports', 'technical-generation-summary.json'), { schemaVersion: 'technical-generation-summary-v1', generatedAt, formulaVersion: index.formulaVersion, generated: items.length, scoreAvailable: items.filter((item) => item.scoreAvailable).length, failed: items.filter((item) => !item.scoreAvailable).length })
await atomicWriteJson(path.join(root, 'reports', 'technical-generation-gap.json'), { schemaVersion: 'technical-generation-gap-v1', generatedAt, investigatedGapCount: gaps.length, unresolvedGapCount: gaps.filter((item) => !item.resolved).length, gaps })
console.log(`[technical:manifest] ${items.length} 檔；可計算 ${items.filter((item) => item.scoreAvailable).length}；原 94/92 缺口追蹤 ${gaps.length} 檔。`)
