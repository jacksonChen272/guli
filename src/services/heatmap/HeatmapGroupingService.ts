import type { HeatmapSizingMetric, HeatmapVisualNode, MarketHeatmapDataset, MarketHeatmapNode } from '../../types/marketHeatmap'
import { getHeatmapSize, limitHeatmapStocks, sortByHeatmapSize } from './HeatmapSizingService'

export function getIndustryStocks(dataset: MarketHeatmapDataset, industryId: string) {
  return dataset.stocks.filter((node) => node.industryId === industryId)
}

export function buildIndustryVisualNodes(dataset: MarketHeatmapDataset, metric: HeatmapSizingMetric): HeatmapVisualNode[] {
  return sortByHeatmapSize(dataset.industries, metric)
    .map((node) => toVisualNode(node, metric))
    .filter((node): node is HeatmapVisualNode => node !== null)
}

export function buildStockVisualNodes(dataset: MarketHeatmapDataset, metric: HeatmapSizingMetric, industryId: string | null = null, limit = 100): HeatmapVisualNode[] {
  const source = industryId ? getIndustryStocks(dataset, industryId) : dataset.stocks
  return limitHeatmapStocks(source, metric, limit)
    .map((node) => toVisualNode(node, metric))
    .filter((node): node is HeatmapVisualNode => node !== null)
}

export function groupStocksByIndustry(stocks: MarketHeatmapNode[]) {
  const groups = new Map<string, MarketHeatmapNode[]>()
  stocks.forEach((stock) => {
    const key = stock.industryId ?? 'unclassified'
    groups.set(key, [...(groups.get(key) ?? []), stock])
  })
  return groups
}

function toVisualNode(node: MarketHeatmapNode, metric: HeatmapSizingMetric): HeatmapVisualNode | null {
  const value = getHeatmapSize(node, metric)
  return value === null ? null : { id: node.id, name: node.name, value, node }
}
