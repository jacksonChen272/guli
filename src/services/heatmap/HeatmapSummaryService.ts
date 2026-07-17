import type { MarketHeatmapDataset, MarketHeatmapNode } from '../../types/marketHeatmap'

export interface HeatmapSummary {
  sampleSize: number
  mappedStockCount: number
  unmappedStockCount: number
  coverageRate: number
  advanceCount: number
  declineCount: number
  unchangedCount: number
  totalTradingAmount: number
  sourceLabel: 'Official' | 'Derived' | 'Mixed' | 'Missing'
}

export function summarizeHeatmap(dataset: MarketHeatmapDataset): HeatmapSummary {
  const stocks = dataset.stocks
  return {
    sampleSize: dataset.sampleSize,
    mappedStockCount: dataset.mappedStockCount,
    unmappedStockCount: dataset.unmappedStockCount,
    coverageRate: dataset.coverageRate,
    advanceCount: stocks.filter((node) => (node.changePercent ?? 0) > 0).length,
    declineCount: stocks.filter((node) => (node.changePercent ?? 0) < 0).length,
    unchangedCount: stocks.filter((node) => node.changePercent === 0).length,
    totalTradingAmount: sum(stocks, (node) => node.tradingAmount),
    sourceLabel: sourceLabel(dataset),
  }
}

export function sourceLabel(dataset: MarketHeatmapDataset): HeatmapSummary['sourceLabel'] {
  if (!dataset.sampleSize) return 'Missing'
  if (dataset.sourceSummary.mock.length || dataset.sourceSummary.derived.length) return dataset.sourceSummary.official.length ? 'Mixed' : 'Derived'
  return dataset.sourceSummary.official.length ? 'Official' : 'Missing'
}

const sum = (nodes: MarketHeatmapNode[], pick: (node: MarketHeatmapNode) => number | null) => nodes.reduce((total, node) => total + (pick(node) ?? 0), 0)
