import { describe, expect, it } from 'vitest'
import { isHeatmapStale, validateHeatmapDataset, validateHeatmapNode } from '../HeatmapDataService'
import { resolveHeatmapColor } from '../HeatmapColorService'
import { buildIndustryVisualNodes, buildStockVisualNodes, getIndustryStocks, groupStocksByIndustry } from '../HeatmapGroupingService'
import { getHeatmapSize, limitHeatmapStocks, sortByHeatmapSize } from '../HeatmapSizingService'
import { sourceLabel, summarizeHeatmap } from '../HeatmapSummaryService'
import { buildHeatmapTooltip, formatScore } from '../HeatmapTooltipService'
import type { MarketHeatmapDataset, MarketHeatmapNode } from '../../../types/marketHeatmap'

const node = (overrides: Partial<MarketHeatmapNode> = {}): MarketHeatmapNode => ({
  id: 'stock:2330', type: 'stock', symbol: '2330', name: '台積電', industryId: 'semiconductor', industryName: '半導體', tradeDate: '2026-07-16', close: 1200,
  changePercent: 2, tradingAmount: 10_000, tradingVolume: 500, marketWeight: 50, sizeValue: 10_000, colorValue: 2, technicalScore: 80, decisionScore: 82,
  riskLevel: 'low', source: ['TWSE Official', 'Industry Mapping (Derived)'], status: 'mixed', warnings: [], ...overrides,
})
const dataset = (overrides: Partial<MarketHeatmapDataset> = {}): MarketHeatmapDataset => {
  const stocks = [node(), node({ id: 'stock:2317', symbol: '2317', name: '鴻海', tradingAmount: 5_000, tradingVolume: 900, marketWeight: 25, changePercent: -1 })]
  const industries = [node({ id: 'industry:semiconductor', type: 'industry', symbol: null, name: '半導體', tradingAmount: 15_000, tradingVolume: 1_400, marketWeight: 75 })]
  return { schemaVersion: '1.0', tradeDate: '2026-07-16', generatedAt: '2026-07-16T13:30:00.000Z', sampleSize: 2, totalStockUniverse: 2, mappedStockCount: 2, unmappedStockCount: 0, coverageRate: 100, sizingMetric: 'tradingAmount', colorMetric: 'changePercent', industries, stocks, sourceSummary: { official: ['TWSE'], derived: ['mapping'], mock: [], missing: [] }, status: 'ready', warnings: [], ...overrides }
}

describe('Heatmap sizing and grouping', () => {
  it('uses trading amount as the default size', () => expect(getHeatmapSize(node(), 'tradingAmount')).toBe(10_000))
  it('supports trading volume sizing', () => expect(getHeatmapSize(node(), 'tradingVolume')).toBe(500))
  it('keeps a missing size as null', () => expect(getHeatmapSize(node({ tradingAmount: null }), 'tradingAmount')).toBeNull())
  it('sorts deterministically by size', () => expect(sortByHeatmapSize(dataset().stocks, 'tradingAmount').map((item) => item.symbol)).toEqual(['2330', '2317']))
  it('limits stock mode to the requested top N', () => expect(limitHeatmapStocks(dataset().stocks, 'tradingAmount', 1)).toHaveLength(1))
  it('groups stocks by the existing industry mapping', () => expect(groupStocksByIndustry(dataset().stocks).get('semiconductor')).toHaveLength(2))
  it('puts missing mappings in the unclassified group', () => expect(groupStocksByIndustry([node({ industryId: null, industryName: '未分類' })]).has('unclassified')).toBe(true))
  it('finds stocks for an industry without guessing by name', () => expect(getIndustryStocks(dataset(), 'semiconductor').map((item) => item.symbol)).toEqual(['2330', '2317']))
  it('builds industry visual nodes', () => expect(buildIndustryVisualNodes(dataset(), 'tradingAmount')[0].node.type).toBe('industry'))
  it('builds stock visual nodes for drill-down', () => expect(buildStockVisualNodes(dataset(), 'tradingAmount', 'semiconductor', 100)).toHaveLength(2))
})

describe('Heatmap colors and tooltip', () => {
  it('uses a red family color for gains', () => expect(resolveHeatmapColor(node({ changePercent: 4 }), 'changePercent').color).toMatch(/^#(?:[89a-f][0-9a-f]){1}/i))
  it('uses a green family label for declines', () => expect(resolveHeatmapColor(node({ changePercent: -4 }), 'changePercent').label).toBe('下跌'))
  it('uses a neutral color near zero', () => expect(resolveHeatmapColor(node({ changePercent: 0.05 }), 'changePercent').label).toBe('接近平盤'))
  it('does not replace a missing Technical Score with zero', () => expect(resolveHeatmapColor(node({ technicalScore: null }), 'technicalScore')).toMatchObject({ value: null, available: false }))
  it('maps high scores to a positive label', () => expect(resolveHeatmapColor(node({ decisionScore: 85 }), 'decisionScore').label).toBe('偏強'))
  it('maps low scores to a negative label', () => expect(resolveHeatmapColor(node({ decisionScore: 25 }), 'decisionScore').label).toBe('偏弱'))
  it('returns all required tooltip rows', () => expect(buildHeatmapTooltip(node(), 'changePercent').map((row) => row.label)).toEqual(['漲跌幅', '成交金額', 'Technical Score', 'Decision Score', '資料來源', '交易日期']))
  it('formats a missing score as a dash', () => expect(formatScore(null)).toBe('—'))
  it('explains neutral score coloring when score data is missing', () => expect(buildHeatmapTooltip(node({ decisionScore: null }), 'decisionScore').some((row) => row.value.includes('資料不足'))).toBe(true))
})

describe('Heatmap quality, coverage and stale state', () => {
  it('calculates breadth and total amount from actual samples', () => expect(summarizeHeatmap(dataset())).toMatchObject({ advanceCount: 1, declineCount: 1, totalTradingAmount: 15_000 }))
  it('labels official plus derived sources as Mixed', () => expect(sourceLabel(dataset())).toBe('Mixed'))
  it('accepts a valid dataset', () => expect(validateHeatmapDataset(dataset())).toEqual([]))
  it('rejects negative trading values', () => expect(validateHeatmapNode(node({ tradingAmount: -1 })).join(' ')).toContain('不可為負數'))
  it('rejects an invalid score range', () => expect(validateHeatmapNode(node({ decisionScore: 101 })).join(' ')).toContain('0–100'))
  it('rejects inconsistent coverage', () => expect(validateHeatmapDataset(dataset({ coverageRate: 25 })).join(' ')).toContain('coverageRate'))
  it('rejects duplicate node ids', () => expect(validateHeatmapDataset(dataset({ industries: [node()] })).join(' ')).toContain('重複節點'))
  it('marks old data as stale', () => expect(isHeatmapStale('2026-06-01', new Date('2026-07-17T00:00:00Z'))).toBe(true))
  it('does not mark a recent previous trading day stale', () => expect(isHeatmapStale('2026-07-16', new Date('2026-07-17T00:00:00Z'))).toBe(false))
})
