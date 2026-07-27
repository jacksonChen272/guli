import { buildHeatmapTooltip } from '../../services/heatmap/HeatmapTooltipService'
import type { HeatmapColorMetric, MarketHeatmapNode } from '../../types/marketHeatmap'

export function formatHeatmapTooltipHtml(
  node: MarketHeatmapNode,
  metric: HeatmapColorMetric,
  marketRank?: number,
) {
  const rows = buildHeatmapTooltip(node, metric)
  const rankRow = marketRank
    ? `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#78909c">Market Rank</span><strong style="color:#dbe4e2">#${marketRank}</strong></div>`
    : ''

  return [
    '<div style="min-width:230px;max-width:300px">',
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">',
    `<div><div style="font-weight:700;color:#f8fafc;font-size:13px">${escapeHtml(node.symbol ? `${node.symbol} ${node.name}` : node.name)}</div>`,
    `<div style="margin-top:3px;color:#78909c;font-size:11px">${escapeHtml(node.industryName)}</div></div>`,
    `<span style="border:1px solid rgba(83,217,178,.25);border-radius:6px;padding:2px 6px;color:#8be4c8;font-size:10px">${escapeHtml(node.type === 'stock' ? 'STOCK' : 'INDUSTRY')}</span>`,
    '</div>',
    '<div style="height:1px;background:rgba(255,255,255,.07);margin:10px 0"></div>',
    '<div style="display:grid;gap:7px">',
    rankRow,
    rows.map((row) => `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#78909c">${escapeHtml(row.label)}</span><strong style="font-variant-numeric:tabular-nums;color:${row.tone === 'up' ? '#fda4af' : row.tone === 'down' ? '#6ee7b7' : '#dbe4e2'}">${escapeHtml(row.value)}</strong></div>`).join(''),
    '</div>',
    '</div>',
  ].join('')
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
