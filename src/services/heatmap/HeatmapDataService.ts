import type { MarketHeatmapDataset, MarketHeatmapNode } from '../../types/marketHeatmap'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

export function validateHeatmapNode(node: MarketHeatmapNode): string[] {
  const errors: string[] = []
  if (!node.id || !node.name) errors.push('節點識別與名稱不可空白')
  if (!datePattern.test(node.tradeDate)) errors.push('交易日期格式無效')
  if (node.type === 'stock' && !node.symbol) errors.push('個股節點缺少股票代號')
  for (const [label, value] of [['收盤價', node.close], ['成交金額', node.tradingAmount], ['成交量', node.tradingVolume], ['區塊面積', node.sizeValue]] as const) {
    if (value !== null && (!Number.isFinite(value) || value < 0)) errors.push(`${label}不可為負數或非有限數值`)
  }
  for (const score of [node.technicalScore, node.decisionScore]) if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) errors.push('分數必須介於 0–100')
  return errors
}

export function validateHeatmapDataset(dataset: MarketHeatmapDataset): string[] {
  const errors: string[] = []
  if (dataset.schemaVersion !== '1.0') errors.push('Heatmap schemaVersion 必須為 1.0')
  if (!datePattern.test(dataset.tradeDate)) errors.push('Heatmap tradeDate 格式無效')
  if (!Number.isFinite(Date.parse(dataset.generatedAt))) errors.push('Heatmap generatedAt 無效')
  if (dataset.sampleSize !== dataset.stocks.length) errors.push('sampleSize 與 stocks 長度不一致')
  if (dataset.mappedStockCount !== dataset.stocks.length) errors.push('mappedStockCount 與 stocks 長度不一致')
  if (dataset.mappedStockCount + dataset.unmappedStockCount !== dataset.totalStockUniverse) errors.push('分類股票數與全市場股票數不一致')
  const expectedCoverage = dataset.totalStockUniverse ? dataset.mappedStockCount / dataset.totalStockUniverse * 100 : 0
  if (Math.abs(dataset.coverageRate - expectedCoverage) > 0.01) errors.push('coverageRate 計算不一致')
  const ids = new Set<string>()
  for (const node of [...dataset.industries, ...dataset.stocks]) {
    if (ids.has(node.id)) errors.push(`重複節點 ${node.id}`)
    ids.add(node.id)
    errors.push(...validateHeatmapNode(node).map((message) => `${node.id}: ${message}`))
  }
  return errors
}

export function isHeatmapStale(tradeDate: string, today = new Date(), maxCalendarDays = 7) {
  if (!datePattern.test(tradeDate)) return true
  const trade = new Date(`${tradeDate}T00:00:00Z`)
  const now = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  return (now.getTime() - trade.getTime()) / 86_400_000 > maxCalendarDays
}
