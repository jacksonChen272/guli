import { buildHeatmapTooltip } from '../../services/heatmap/HeatmapTooltipService'
import type { HeatmapColorMetric, MarketHeatmapNode } from '../../types/marketHeatmap'

export function formatHeatmapTooltipHtml(node: MarketHeatmapNode, metric: HeatmapColorMetric) {
  const rows = buildHeatmapTooltip(node, metric)
  return `<div style="min-width:210px;max-width:280px"><div style="font-weight:700;color:#f8fafc">${escapeHtml(node.symbol ? `${node.symbol} ${node.name}` : node.name)}</div><div style="margin-top:3px;color:#78909c;font-size:11px">${escapeHtml(node.industryName)}</div><div style="margin-top:10px;display:grid;gap:6px">${rows.map((row) => `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#78909c">${escapeHtml(row.label)}</span><strong style="color:${row.tone === 'up' ? '#fda4af' : row.tone === 'down' ? '#6ee7b7' : '#dbe4e2'}">${escapeHtml(row.value)}</strong></div>`).join('')}</div></div>`
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
