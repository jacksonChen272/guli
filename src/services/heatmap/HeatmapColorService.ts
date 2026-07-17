import type { HeatmapColorMetric, MarketHeatmapNode } from '../../types/marketHeatmap'

export interface HeatmapColorResult { color: string; value: number | null; available: boolean; label: string }

export function getHeatmapColorValue(node: MarketHeatmapNode, metric: HeatmapColorMetric) {
  if (metric === 'technicalScore') return node.technicalScore
  if (metric === 'decisionScore') return node.decisionScore
  return node.changePercent
}

export function resolveHeatmapColor(node: MarketHeatmapNode, metric: HeatmapColorMetric): HeatmapColorResult {
  const value = getHeatmapColorValue(node, metric)
  if (value === null || !Number.isFinite(value)) return { color: '#52616b', value: null, available: false, label: '資料不足' }
  if (metric === 'changePercent') {
    const intensity = Math.min(1, Math.abs(value) / 7)
    if (Math.abs(value) < 0.1) return { color: '#475569', value, available: true, label: '接近平盤' }
    if (value > 0) return { color: interpolate('#7f1d1d', '#fb7185', intensity), value, available: true, label: '上漲' }
    return { color: interpolate('#064e3b', '#34d399', intensity), value, available: true, label: '下跌' }
  }
  const normalized = Math.max(0, Math.min(100, value))
  if (normalized >= 60) return { color: interpolate('#7f1d1d', '#fb7185', (normalized - 60) / 40), value, available: true, label: '偏強' }
  if (normalized <= 40) return { color: interpolate('#064e3b', '#34d399', (40 - normalized) / 40), value, available: true, label: '偏弱' }
  return { color: '#475569', value, available: true, label: '中性' }
}

function interpolate(from: string, to: string, ratio: number) {
  const safeRatio = Math.max(0, Math.min(1, ratio))
  const start = hexToRgb(from)
  const end = hexToRgb(to)
  const value = start.map((channel, index) => Math.round(channel + (end[index] - channel) * safeRatio))
  return `#${value.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function hexToRgb(value: string) {
  const normalized = value.replace('#', '')
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16))
}
