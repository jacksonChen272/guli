import { describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { mergeHistoryPoints, sanitizeHistoryPoints, synchronizeHistoryMetadata } from '../../../../scripts/data/history/HistoryValidator.ts'
import { repairHistoryMetadata, repairHistoryMetadataRecord } from '../../../../scripts/data/history/repairHistoryMetadata.ts'
import type { HistoryPricePoint, TwseHistoryDataset } from '../../../../scripts/data/history/types.ts'

const point = (tradeDate: string, close = 10): HistoryPricePoint => ({
  tradeDate,
  open: close,
  high: close,
  low: close,
  close,
  change: 0,
  volume: 1,
  tradingAmount: 1,
  transactionCount: 1,
})

const dataset = (prices: HistoryPricePoint[], metadata: Partial<TwseHistoryDataset> = {}): TwseHistoryDataset => ({
  schemaVersion: '1.0',
  symbol: '2330',
  name: '台積電',
  market: 'TWSE',
  source: 'TWSE',
  sourceUrl: 'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY',
  fetchedAt: '2026-07-23T08:00:00.000Z',
  firstTradeDate: prices[0]?.tradeDate ?? null,
  lastTradeDate: prices.at(-1)?.tradeDate ?? null,
  recordCount: prices.length,
  status: 'partial',
  warnings: [],
  prices,
  ...metadata,
})

describe('history metadata consistency', () => {
  it('updates recordCount after appending a new trade day', () => {
    const prices = mergeHistoryPoints([point('2026-07-22')], [point('2026-07-23')])
    const result = synchronizeHistoryMetadata(dataset(prices, { recordCount: 1 })).dataset
    expect(result.recordCount).toBe(2)
  })

  it('does not increase recordCount when an existing trade day is overwritten', () => {
    const prices = mergeHistoryPoints([point('2026-07-23', 10)], [point('2026-07-23', 12)])
    const result = synchronizeHistoryMetadata(dataset(prices, { recordCount: 2 })).dataset
    expect(result.recordCount).toBe(1)
    expect(result.prices[0].close).toBe(12)
  })

  it('uses the de-duplicated length for recordCount', () => {
    const normalized = sanitizeHistoryPoints([point('2026-07-22'), point('2026-07-22', 12), point('2026-07-23')])
    const result = synchronizeHistoryMetadata(dataset(normalized.points, { recordCount: 3 })).dataset
    expect(result.recordCount).toBe(2)
    expect(result.prices.map((item) => item.tradeDate)).toEqual(['2026-07-22', '2026-07-23'])
  })

  it('uses null date metadata for an empty prices array', () => {
    const result = synchronizeHistoryMetadata(dataset([], { recordCount: 9, firstTradeDate: '2026-01-01', lastTradeDate: '2026-01-31' })).dataset
    expect(result).toMatchObject({ recordCount: 0, firstTradeDate: null, lastTradeDate: null })
  })

  it('recalculates firstTradeDate and lastTradeDate from sorted prices', () => {
    const prices = mergeHistoryPoints([], [point('2026-07-23'), point('2026-07-21'), point('2026-07-22')])
    const result = synchronizeHistoryMetadata(dataset(prices, { firstTradeDate: null, lastTradeDate: null })).dataset
    expect(result.firstTradeDate).toBe('2026-07-21')
    expect(result.lastTradeDate).toBe('2026-07-23')
  })

  it('repairs metadata without modifying the prices array', () => {
    const prices = [point('2026-07-22'), point('2026-07-23')]
    const before = JSON.stringify(prices)
    const result = repairHistoryMetadataRecord(dataset(prices, { recordCount: 99 }), '2330', '台積電')
    expect(result.dataset.prices).toBe(prices)
    expect(JSON.stringify(result.dataset.prices)).toBe(before)
    expect(result.differences.map((item) => item.field)).toContain('recordCount')
  })

  it('synchronizes identity and source metadata without changing fetchedAt', () => {
    const original = dataset([point('2026-07-23')], { symbol: '9999', name: '舊名稱', source: 'TWSE' })
    const result = repairHistoryMetadataRecord(original, '2330', '台積電').dataset
    expect(result).toMatchObject({ symbol: '2330', name: '台積電', source: 'TWSE', fetchedAt: original.fetchedAt })
  })

  it('repairs an on-disk dataset without changing serialized prices', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'guli-history-repair-'))
    try {
      const stockDirectory = path.join(root, 'public', 'data', 'twse-stock-history', 'stocks')
      const universeDirectory = path.join(root, 'public', 'data', 'twse-stocks')
      await mkdir(stockDirectory, { recursive: true })
      await mkdir(universeDirectory, { recursive: true })
      const prices = [point('2026-07-22'), point('2026-07-23')]
      await writeFile(path.join(stockDirectory, '2330.json'), JSON.stringify(dataset(prices, { recordCount: 99 })), 'utf8')
      await writeFile(path.join(universeDirectory, 'latest.json'), JSON.stringify({ records: [{ symbol: '2330', name: '台積電' }] }), 'utf8')
      const before = JSON.stringify(prices)
      const summary = await repairHistoryMetadata(root)
      const repaired = JSON.parse(await readFile(path.join(stockDirectory, '2330.json'), 'utf8')) as TwseHistoryDataset
      expect(summary.repaired.map((item) => item.symbol)).toEqual(['2330'])
      expect(JSON.stringify(repaired.prices)).toBe(before)
      expect(repaired.recordCount).toBe(2)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
