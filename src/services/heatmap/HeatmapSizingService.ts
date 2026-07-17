import type { HeatmapSizingMetric, MarketHeatmapNode } from '../../types/marketHeatmap'

export function getHeatmapSize(node: MarketHeatmapNode, metric: HeatmapSizingMetric): number | null {
  const value = metric === 'tradingVolume' ? node.tradingVolume : node.tradingAmount
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

export function sortByHeatmapSize(nodes: MarketHeatmapNode[], metric: HeatmapSizingMetric) {
  return [...nodes].sort((left, right) => (getHeatmapSize(right, metric) ?? -1) - (getHeatmapSize(left, metric) ?? -1) || left.id.localeCompare(right.id))
}

export function limitHeatmapStocks(nodes: MarketHeatmapNode[], metric: HeatmapSizingMetric, limit = 100) {
  return sortByHeatmapSize(nodes.filter((node) => node.type === 'stock' && getHeatmapSize(node, metric) !== null), metric).slice(0, Math.max(0, limit))
}
