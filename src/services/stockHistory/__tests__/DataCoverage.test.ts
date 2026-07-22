import { describe, expect, it } from 'vitest'
import { buildHistoryManifest } from '../../../../scripts/data/history/HistoryManifestWriter.ts'

describe('History Data Coverage', () => {
  it('uses manifest counts instead of a hard-coded total', () => { const manifest = buildHistoryManifest([{ symbol: '1101', name: 'A', instrumentType: 'stock' }, { symbol: '0050', name: 'ETF', instrumentType: 'etf' }], new Map(), []); expect(manifest.summary.commonStocks).toBe(1); expect(manifest.summary.unsupported).toBe(1) })
  it('does not count pending data as official', () => { const manifest = buildHistoryManifest([{ symbol: '1101', name: 'A', instrumentType: 'stock' }], new Map(), []); expect(manifest.summary.officialValid).toBe(0); expect(manifest.items[0].isOfficial).toBe(false) })
})
