import { describe, expect, it, vi } from 'vitest'
import { MarketHeatmapRepository } from '../MarketHeatmapRepository'
import type { MarketHeatmapDataset, MarketHeatmapNode } from '../../types/marketHeatmap'

const stock: MarketHeatmapNode = { id: 'stock:2330', type: 'stock', symbol: '2330', name: '台積電', industryId: 'semi', industryName: '半導體', tradeDate: '2026-07-16', close: 1200, changePercent: 1, tradingAmount: 100, tradingVolume: 10, marketWeight: 100, sizeValue: 100, colorValue: 1, technicalScore: 80, decisionScore: 82, riskLevel: 'low', source: ['TWSE'], status: 'mixed', warnings: [] }
const industry: MarketHeatmapNode = { ...stock, id: 'industry:semi', type: 'industry', symbol: null, name: '半導體' }
const dataset: MarketHeatmapDataset = { schemaVersion: '1.0', tradeDate: '2026-07-16', generatedAt: '2026-07-16T08:00:00.000Z', sampleSize: 1, totalStockUniverse: 1, mappedStockCount: 1, unmappedStockCount: 0, coverageRate: 100, sizingMetric: 'tradingAmount', colorMetric: 'changePercent', industries: [industry], stocks: [stock], sourceSummary: { official: ['TWSE'], derived: ['mapping'], mock: [], missing: [] }, status: 'ready', warnings: [] }

describe('MarketHeatmapRepository', () => {
  it('uses the GitHub Pages base URL', async () => { const fetcher = vi.fn(async () => new Response(JSON.stringify(dataset))); await new MarketHeatmapRepository(fetcher, '/guli/').getLatest(); expect(String(fetcher.mock.calls[0][0])).toBe('/guli/data/market-heatmap/latest.json') })
  it('does not read the same valid cache twice', async () => { const fetcher = vi.fn(async () => new Response(JSON.stringify(dataset))); const repository = new MarketHeatmapRepository(fetcher, '/guli/'); await repository.getLatest(); await repository.getLatest(); expect(fetcher).toHaveBeenCalledTimes(1) })
  it('refreshes when explicitly requested', async () => { const fetcher = vi.fn(async () => new Response(JSON.stringify(dataset))); const repository = new MarketHeatmapRepository(fetcher, '/guli/'); await repository.getLatest(); await repository.refresh(); expect(fetcher).toHaveBeenCalledTimes(2) })
  it('returns stocks only from the requested industry', async () => { const repository = new MarketHeatmapRepository(async () => new Response(JSON.stringify(dataset)), '/guli/'); expect(await repository.getStocks('semi')).toHaveLength(1); expect(await repository.getStocks('shipping')).toHaveLength(0) })
  it('throws a structured error for a missing static JSON', async () => { const repository = new MarketHeatmapRepository(async () => new Response('', { status: 404 }), '/guli/'); await expect(repository.getLatest()).rejects.toThrow('HTTP 404') })
  it('rejects an invalid dataset before caching it', async () => { const repository = new MarketHeatmapRepository(async () => new Response(JSON.stringify({ ...dataset, coverageRate: 20 })), '/guli/'); await expect(repository.getLatest()).rejects.toThrow('未通過驗證') })
})
