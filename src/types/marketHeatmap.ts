export type HeatmapNodeType = 'industry' | 'stock'
export type HeatmapSizingMetric = 'tradingAmount' | 'tradingVolume'
export type HeatmapColorMetric = 'changePercent' | 'technicalScore' | 'decisionScore'
export type HeatmapSourceStatus = 'official' | 'derived' | 'mixed' | 'missing'
export type HeatmapDatasetStatus = 'ready' | 'partial' | 'stale' | 'missing'

export interface MarketHeatmapNode {
  id: string
  type: HeatmapNodeType
  symbol: string | null
  name: string
  industryId: string | null
  industryName: string
  officialIndustryName?: string | null
  displayIndustryGroup?: string
  mappingStatus?: 'official' | 'derived' | 'missing'
  tradeDate: string
  close: number | null
  changePercent: number | null
  tradingAmount: number | null
  tradingVolume: number | null
  marketWeight: number | null
  sizeValue: number | null
  colorValue: number | null
  technicalScore: number | null
  decisionScore: number | null
  riskLevel: 'low' | 'medium' | 'high' | null
  source: string[]
  status: HeatmapSourceStatus
  warnings: string[]
}

export interface HeatmapSourceSummary {
  official: string[]
  derived: string[]
  mock: string[]
  missing: string[]
}

export interface MarketHeatmapDataset {
  schemaVersion: '1.0'
  tradeDate: string
  generatedAt: string
  sampleSize: number
  totalStockUniverse: number
  mappedStockCount: number
  unmappedStockCount: number
  coverageRate: number
  officialMappedStockCount?: number
  derivedMappedStockCount?: number
  officialCoverageRate?: number
  derivedCoverageRate?: number
  mappingStatus?: 'Official' | 'Mixed' | 'Partial'
  mappingUpdatedAt?: string | null
  mappingEffectiveDate?: string | null
  sizingMetric: HeatmapSizingMetric
  colorMetric: HeatmapColorMetric
  industries: MarketHeatmapNode[]
  stocks: MarketHeatmapNode[]
  sourceSummary: HeatmapSourceSummary
  status: HeatmapDatasetStatus
  warnings: string[]
}

export interface MarketHeatmapIndexEntry {
  tradeDate: string
  path: string
  sampleSize: number
  coverageRate: number
  status: HeatmapDatasetStatus
}

export interface MarketHeatmapIndex {
  schemaVersion: '1.0'
  updatedAt: string
  latestTradeDate: string | null
  dates: MarketHeatmapIndexEntry[]
}

export interface HeatmapVisualNode {
  id: string
  name: string
  value: number
  node: MarketHeatmapNode
}

export interface HeatmapTooltipRow {
  label: string
  value: string
  tone?: 'up' | 'down' | 'neutral'
}
