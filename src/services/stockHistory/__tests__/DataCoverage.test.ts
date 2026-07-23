import { describe, expect, it } from 'vitest'
import { buildHistoryManifest } from '../../../../scripts/data/history/HistoryManifestWriter.ts'

describe('History Data Coverage', () => {
  it('uses disjoint eligible and unsupported denominators', () => { const manifest = buildHistoryManifest([{ symbol: '1101', name: 'A', instrumentType: 'stock' }, { symbol: '0050', name: 'ETF', instrumentType: 'etf' }], new Map(), []); expect(manifest.summary).toMatchObject({ totalSecurities: 2, eligibleCommonStocks: 1, unsupportedSecurities: 1 }); expect(manifest.summary.totalSecurities).toBe(manifest.summary.eligibleCommonStocks + manifest.summary.unsupportedSecurities) })
  it('keeps all eligible statuses equal to the eligible denominator', () => { const manifest = buildHistoryManifest([{ symbol: '1101', name: 'A', instrumentType: 'stock' }, { symbol: '1102', name: 'B', instrumentType: 'stock' }], new Map(), [{ symbol: '1102', category: 'NO_DATA', message: 'none', attempts: 1, occurredAt: '2026-01-01T00:00:00.000Z' }]); const { complete, partial, pending, failed, eligibleCommonStocks } = manifest.summary; expect(complete + partial + pending + failed).toBe(eligibleCommonStocks); expect(manifest.summary.coverageInvariantValid).toBe(true) })
  it('does not count pending data as official', () => { const manifest = buildHistoryManifest([{ symbol: '1101', name: 'A', instrumentType: 'stock' }], new Map(), []); expect(manifest.summary.officialValid).toBe(0); expect(manifest.items[0].isOfficial).toBe(false) })
})
