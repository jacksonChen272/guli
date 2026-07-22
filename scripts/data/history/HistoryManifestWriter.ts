import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { HistoryFailure, HistoryManifest, HistoryManifestItem, HistoryProgress, HistorySecurity, TwseHistoryDataset } from './types.ts'
import { validateHistoryDataset } from './HistoryValidator.ts'

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await readFile(file, 'utf8')) as T }
  catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return fallback
    throw error
  }
}

export async function atomicWriteJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  try { JSON.parse(await readFile(temporary, 'utf8')); await rename(temporary, file) }
  catch (error) { await unlink(temporary).catch(() => undefined); throw error }
}

export function buildHistoryManifest(
  securities: HistorySecurity[],
  datasets: Map<string, TwseHistoryDataset>,
  failures: HistoryFailure[],
  targetTradingDays = 300,
  technicalMinimumDays = 120,
  updatedAt = new Date().toISOString(),
): HistoryManifest {
  const failedBySymbol = new Map(failures.map((failure) => [failure.symbol, failure]))
  const items: HistoryManifestItem[] = securities.map((security) => {
    const eligible = security.instrumentType === 'stock' && /^\d{4}$/.test(security.symbol)
    if (!eligible) return { symbol: security.symbol, name: security.name, status: 'unsupported', recordCount: 0, firstDate: null, lastDate: null, lastUpdatedAt: null, source: 'TWSE', isOfficial: false, validationStatus: 'unsupported', errors: [`不支援商品類型：${security.instrumentType}`], securityType: security.instrumentType, eligibleForTechnical: false, path: null }
    const dataset = datasets.get(security.symbol)
    const failure = failedBySymbol.get(security.symbol)
    if (!dataset) return { symbol: security.symbol, name: security.name, status: failure ? 'failed' : 'pending', recordCount: 0, firstDate: null, lastDate: null, lastUpdatedAt: failure?.occurredAt ?? null, source: 'TWSE', isOfficial: false, validationStatus: failure ? 'invalid' : 'pending', errors: failure ? [`${failure.category}: ${failure.message}`] : [], securityType: security.instrumentType, eligibleForTechnical: false, path: null }
    const validation = validateHistoryDataset(dataset, security.symbol)
    const status = !validation.valid ? 'failed' : dataset.recordCount >= targetTradingDays ? 'complete' : 'partial'
    return { symbol: security.symbol, name: dataset.name || security.name, status, recordCount: dataset.recordCount, firstDate: dataset.firstTradeDate, lastDate: dataset.lastTradeDate, lastUpdatedAt: dataset.fetchedAt, source: 'TWSE', isOfficial: validation.valid, validationStatus: validation.valid ? 'valid' : 'invalid', errors: validation.errors, securityType: security.instrumentType, eligibleForTechnical: validation.valid && dataset.recordCount >= technicalMinimumDays, path: validation.valid ? `data/twse-stock-history/stocks/${security.symbol}.json` : null }
  }).sort((left, right) => left.symbol.localeCompare(right.symbol))
  const count = (status: HistoryManifestItem['status']) => items.filter((item) => item.status === status).length
  return { schemaVersion: 'history-manifest-v1', updatedAt, targetTradingDays, technicalMinimumDays, source: 'TWSE', storageRoot: 'data/twse-stock-history/stocks', summary: { total: items.length, commonStocks: items.filter((item) => item.securityType === 'stock' && /^\d{4}$/.test(item.symbol)).length, complete: count('complete'), partial: count('partial'), failed: count('failed'), pending: count('pending'), unsupported: count('unsupported'), officialValid: items.filter((item) => item.isOfficial).length, technicalEligible: items.filter((item) => item.eligibleForTechnical).length }, items }
}

export function buildProgress(manifest: HistoryManifest, startedAt: string, lastProcessedSymbol: string | null, status: HistoryProgress['status']): HistoryProgress {
  const common = manifest.items.filter((item) => item.securityType === 'stock' && /^\d{4}$/.test(item.symbol))
  return { version: 'history-progress-v1', startedAt, updatedAt: manifest.updatedAt, totalSymbols: common.length, completedSymbols: common.filter((item) => item.status === 'complete' || item.status === 'partial').map((item) => item.symbol), failedSymbols: common.filter((item) => item.status === 'failed').map((item) => ({ symbol: item.symbol, category: (item.errors[0]?.split(':')[0] || 'VALIDATION_ERROR') as HistoryFailure['category'], message: item.errors.join('; ') || '驗證失敗', attempts: 1, occurredAt: item.lastUpdatedAt ?? manifest.updatedAt })), pendingSymbols: common.filter((item) => item.status === 'pending').map((item) => item.symbol), lastProcessedSymbol, status }
}
