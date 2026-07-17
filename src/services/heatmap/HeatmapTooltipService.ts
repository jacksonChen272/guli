import { formatAmount } from '../../lib/formatters'
import type { HeatmapColorMetric, HeatmapTooltipRow, MarketHeatmapNode } from '../../types/marketHeatmap'

export function buildHeatmapTooltip(node: MarketHeatmapNode, colorMetric: HeatmapColorMetric): HeatmapTooltipRow[] {
  const rows: HeatmapTooltipRow[] = [
    { label: '漲跌幅', value: formatPercent(node.changePercent), tone: tone(node.changePercent) },
    { label: '成交金額', value: formatAmount(node.tradingAmount) },
    { label: 'Technical Score', value: formatScore(node.technicalScore) },
    { label: 'Decision Score', value: formatScore(node.decisionScore) },
    { label: '資料來源', value: node.source.length ? node.source.join('、') : '尚未取得' },
    { label: '交易日期', value: node.tradeDate || '尚未取得' },
  ]
  if ((colorMetric === 'technicalScore' && node.technicalScore === null) || (colorMetric === 'decisionScore' && node.decisionScore === null)) {
    rows.splice(1, 0, { label: '顏色狀態', value: '資料不足，使用中性色' })
  }
  return rows
}

export const formatScore = (value: number | null) => value === null ? '—' : value.toFixed(1)
export const formatPercent = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
const tone = (value: number | null): HeatmapTooltipRow['tone'] => value === null || value === 0 ? 'neutral' : value > 0 ? 'up' : 'down'
