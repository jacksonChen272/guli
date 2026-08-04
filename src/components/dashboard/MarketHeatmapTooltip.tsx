import { buildHeatmapTooltip } from '../../services/heatmap/HeatmapTooltipService'
import type { HeatmapColorMetric, MarketHeatmapNode } from '../../types/marketHeatmap'

export interface HeatmapTooltipSize {
  contentSize: readonly number[]
  viewSize: readonly number[]
}

export interface HeatmapTooltipViewport {
  left: number
  top: number
  width: number
  height: number
}

const TOOLTIP_GAP = 12

export function resolveHeatmapTooltipPosition(
  point: readonly number[],
  size: HeatmapTooltipSize,
  viewport?: HeatmapTooltipViewport,
): [number, number] {
  const pointX = finiteNumber(point[0])
  const pointY = finiteNumber(point[1])
  const contentWidth = Math.max(0, finiteNumber(size.contentSize[0]))
  const contentHeight = Math.max(0, finiteNumber(size.contentSize[1]))
  const viewWidth = Math.max(0, finiteNumber(size.viewSize[0]))
  const viewHeight = Math.max(0, finiteNumber(size.viewSize[1]))

  let x = pointX + TOOLTIP_GAP
  let y = pointY + TOOLTIP_GAP

  if (x + contentWidth > viewWidth - TOOLTIP_GAP) {
    x = pointX - contentWidth - TOOLTIP_GAP
  }
  if (y + contentHeight > viewHeight - TOOLTIP_GAP) {
    y = pointY - contentHeight - TOOLTIP_GAP
  }

  const viewportMinX = viewport ? TOOLTIP_GAP - finiteNumber(viewport.left) : TOOLTIP_GAP
  const viewportMinY = viewport ? TOOLTIP_GAP - finiteNumber(viewport.top) : TOOLTIP_GAP
  const viewportMaxX = viewport
    ? finiteNumber(viewport.width) - finiteNumber(viewport.left) - contentWidth - TOOLTIP_GAP
    : Number.POSITIVE_INFINITY
  const viewportMaxY = viewport
    ? finiteNumber(viewport.height) - finiteNumber(viewport.top) - contentHeight - TOOLTIP_GAP
    : Number.POSITIVE_INFINITY

  const minX = Math.max(0, TOOLTIP_GAP, viewportMinX)
  const minY = Math.max(0, TOOLTIP_GAP, viewportMinY)
  const maxX = Math.min(Math.max(0, viewWidth - contentWidth - TOOLTIP_GAP), viewportMaxX)
  const maxY = Math.min(Math.max(0, viewHeight - contentHeight - TOOLTIP_GAP), viewportMaxY)

  return [
    clampPosition(x, minX, maxX),
    clampPosition(y, minY, maxY),
  ]
}

export function formatHeatmapTooltipHtml(
  node: MarketHeatmapNode,
  metric: HeatmapColorMetric,
  marketRank?: number,
) {
  const rows = buildHeatmapTooltip(node, metric)
  const rankRow = marketRank
    ? '<div class="heatmap-tooltip-row"><span class="heatmap-tooltip-label" style="color:#78909c">Market Rank</span>'
      + `<strong class="heatmap-tooltip-value" style="color:#dbe4e2">#${marketRank}</strong></div>`
    : ''

  return [
    '<div class="heatmap-tooltip-content">',
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">',
    `<div style="min-width:0;overflow-wrap:anywhere"><div style="font-weight:700;color:#f8fafc;font-size:13px">${escapeHtml(node.symbol ? `${node.symbol} ${node.name}` : node.name)}</div>`,
    `<div style="margin-top:3px;color:#78909c;font-size:11px">${escapeHtml(node.industryName)}</div></div>`,
    `<span style="border:1px solid rgba(83,217,178,.25);border-radius:6px;padding:2px 6px;color:#8be4c8;font-size:10px">${escapeHtml(node.type === 'stock' ? 'STOCK' : 'INDUSTRY')}</span>`,
    '</div>',
    '<div style="height:1px;background:rgba(255,255,255,.07);margin:10px 0"></div>',
    '<div style="display:grid;gap:7px">',
    rankRow,
    rows.map((row) => `<div class="heatmap-tooltip-row"><span class="heatmap-tooltip-label" style="color:#78909c">${escapeHtml(row.label)}</span><strong class="heatmap-tooltip-value" style="font-variant-numeric:tabular-nums;color:${row.tone === 'up' ? '#fda4af' : row.tone === 'down' ? '#6ee7b7' : '#dbe4e2'}">${escapeHtml(row.value)}</strong></div>`).join(''),
    '</div>',
    '</div>',
  ].join('')
}

const finiteNumber = (value: number | undefined) => Number.isFinite(value) ? Number(value) : 0
const clampPosition = (value: number, minimum: number, maximum: number) => {
  const safeMinimum = Math.max(0, finiteNumber(minimum))
  const safeMaximum = Math.max(safeMinimum, finiteNumber(maximum))
  return Math.max(safeMinimum, Math.min(finiteNumber(value), safeMaximum))
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
