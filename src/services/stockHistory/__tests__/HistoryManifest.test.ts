import { describe, expect, it } from 'vitest'
import { buildHistoryManifest, buildProgress } from '../../../../scripts/data/history/HistoryManifestWriter.ts'
import type { HistoryPricePoint, TwseHistoryDataset } from '../../../../scripts/data/history/types.ts'

const prices = (count: number): HistoryPricePoint[] => Array.from({ length: count }, (_, index) => { const date = new Date(Date.UTC(2025, 0, index + 1)); return { tradeDate: date.toISOString().slice(0, 10), open: 10, high: 11, low: 9, close: 10, change: 0, volume: 100, tradingAmount: 1000, transactionCount: 5 } }).filter((row, index, rows) => index === 0 || row.tradeDate !== rows[index - 1].tradeDate)
const data = (symbol: string, count: number): TwseHistoryDataset => { const rows = prices(count); return { schemaVersion: '1.0', symbol, name: symbol, market: 'TWSE', source: 'TWSE', sourceUrl: 'https://www.twse.com.tw/', fetchedAt: '2026-01-01T00:00:00.000Z', firstTradeDate: rows[0]?.tradeDate ?? null, lastTradeDate: rows.at(-1)?.tradeDate ?? null, recordCount: rows.length, status: 'partial', warnings: [], prices: rows } }

describe('History Manifest', () => {
  it('classifies complete, partial, pending and unsupported', () => {
    const manifest = buildHistoryManifest([{ symbol: '1101', name: 'A', instrumentType: 'stock' }, { symbol: '1102', name: 'B', instrumentType: 'stock' }, { symbol: '0050', name: 'ETF', instrumentType: 'etf' }, { symbol: '1103', name: 'C', instrumentType: 'stock' }], new Map([['1101', data('1101', 305)], ['1102', data('1102', 150)]]), [], 300, 120, '2026-01-01T00:00:00.000Z')
    expect(manifest.items.map((item) => item.status)).toEqual(['unsupported', 'complete', 'partial', 'pending'])
    expect(manifest.summary).toMatchObject({ commonStocks: 3, complete: 1, partial: 1, pending: 1, unsupported: 1, technicalEligible: 2 })
  })
  it('builds resumable progress arrays', () => { const manifest = buildHistoryManifest([{ symbol: '1101', name: 'A', instrumentType: 'stock' }], new Map([['1101', data('1101', 150)]]), []); expect(buildProgress(manifest, '2026-01-01T00:00:00.000Z', '1101', 'partial').completedSymbols).toEqual(['1101']) })
})
