import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { atomicWriteJson, readJson } from './HistoryManifestWriter.ts'
import { synchronizeHistoryMetadata } from './HistoryValidator.ts'
import type { HistoryMetadataDifference } from './HistoryValidator.ts'
import type { TwseHistoryDataset } from './types.ts'

export interface HistoryMetadataRepair {
  symbol: string
  differences: HistoryMetadataDifference[]
}

export interface HistoryMetadataRepairSummary {
  scanned: number
  repaired: HistoryMetadataRepair[]
  unchanged: number
  invalid: Array<{ symbol: string; errors: string[] }>
}

export function inspectHistoryPriceOrder(dataset: TwseHistoryDataset): string[] {
  const errors: string[] = []
  const dates = new Set<string>()
  let previous = ''
  for (const point of dataset.prices) {
    if (dates.has(point.tradeDate)) errors.push(`duplicate trade date: ${point.tradeDate}`)
    if (previous && point.tradeDate <= previous) errors.push(`trade dates are not strictly ascending at ${point.tradeDate}`)
    dates.add(point.tradeDate)
    previous = point.tradeDate
  }
  return [...new Set(errors)]
}

export function repairHistoryMetadataRecord(
  dataset: TwseHistoryDataset,
  expectedSymbol = dataset.symbol,
  expectedName = dataset.name,
) {
  return synchronizeHistoryMetadata(dataset, { symbol: expectedSymbol, name: expectedName })
}

export async function repairHistoryMetadata(root = process.cwd()): Promise<HistoryMetadataRepairSummary> {
  const stockDirectory = path.join(root, 'public', 'data', 'twse-stock-history', 'stocks')
  const universe = await readJson<{ records?: Array<{ symbol: string; name: string }> }>(
    path.join(root, 'public', 'data', 'twse-stocks', 'latest.json'),
    {},
  )
  const names = new Map((universe.records ?? []).map((record) => [record.symbol, record.name]))
  const files = (await readdir(stockDirectory).catch(() => []))
    .filter((file) => /^\d{4}\.json$/.test(file))
    .sort()
  const summary: HistoryMetadataRepairSummary = { scanned: files.length, repaired: [], unchanged: 0, invalid: [] }

  for (const file of files) {
    const symbol = file.slice(0, 4)
    const filePath = path.join(stockDirectory, file)
    try {
      const dataset = await readJson<TwseHistoryDataset | null>(filePath, null)
      if (!dataset || !Array.isArray(dataset.prices)) {
        summary.invalid.push({ symbol, errors: ['history dataset or prices array is missing'] })
        continue
      }
      const structuralErrors = inspectHistoryPriceOrder(dataset)
      if (structuralErrors.length) {
        summary.invalid.push({ symbol, errors: structuralErrors })
        continue
      }
      const repaired = repairHistoryMetadataRecord(dataset, symbol, names.get(symbol) || dataset.name)
      const metadataErrors: string[] = []
      if (!repaired.dataset.name.trim()) metadataErrors.push('stock name is missing')
      if (!Number.isFinite(Date.parse(repaired.dataset.fetchedAt))) metadataErrors.push('fetchedAt is not a valid ISO timestamp')
      if (metadataErrors.length) {
        summary.invalid.push({ symbol, errors: metadataErrors })
        continue
      }
      if (repaired.differences.length) {
        await atomicWriteJson(filePath, repaired.dataset)
        summary.repaired.push({ symbol, differences: repaired.differences })
      } else {
        summary.unchanged += 1
      }
    } catch (error) {
      summary.invalid.push({ symbol, errors: [error instanceof Error ? error.message : String(error)] })
    }
  }

  console.log(`[history:repair] scanned=${summary.scanned} repaired=${summary.repaired.length} unchanged=${summary.unchanged} invalid=${summary.invalid.length}`)
  for (const repair of summary.repaired) {
    const changes = repair.differences.map((difference) => `${difference.field}: ${String(difference.before)} -> ${String(difference.after)}`).join('; ')
    console.log(`[history:repair] ${repair.symbol}: ${changes}`)
  }
  for (const invalid of summary.invalid) console.error(`[history:repair] ${invalid.symbol}: ${invalid.errors.join('; ')}`)
  return summary
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === entryUrl) {
  const summary = await repairHistoryMetadata()
  if (summary.invalid.length) process.exitCode = 1
}
