import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { formatHeatmapTooltipHtml, resolveHeatmapTooltipPosition } from '../MarketHeatmapTooltip'
import { heatmapFixture } from './dashboardFixtures'

const heatmap = readFileSync(new URL('../MarketHeatmap.tsx', import.meta.url), 'utf8')
const toolbar = readFileSync(new URL('../MarketHeatmapToolbar.tsx', import.meta.url), 'utf8')
const legend = readFileSync(new URL('../MarketHeatmapLegend.tsx', import.meta.url), 'utf8')

describe('Market Heatmap polish', () => {
  it('adds hover elevation and a highlighted border without changing grouping logic', () => {
    expect(heatmap).toContain("borderColor: 'rgba(83,217,178,.9)'")
    expect(heatmap).toContain('shadowBlur: 20')
    expect(heatmap).toContain('shadowOffsetY: 5')
    expect(heatmap).toContain('buildIndustryVisualNodes')
    expect(heatmap).toContain('buildStockVisualNodes')
  })

  it('shows stock, industry, Decision, Technical, rank, and data date in the hover card', () => {
    const html = formatHeatmapTooltipHtml(heatmapFixture.stocks[0], 'changePercent', 1)
    expect(html).toContain(heatmapFixture.stocks[0].name)
    expect(html).toContain(heatmapFixture.stocks[0].industryName)
    expect(html).toContain('Decision Score')
    expect(html).toContain('Technical Score')
    expect(html).toContain('Market Rank')
    expect(html).toContain('#1')
    expect(html).toContain(heatmapFixture.stocks[0].tradeDate)
  })

  it('wraps long data-source values without truncating important information', () => {
    const source = 'TWSE Official History / Official Institutional Data / GULI Derived Technical Snapshot'
    const html = formatHeatmapTooltipHtml({ ...heatmapFixture.stocks[0], source: [source] }, 'changePercent', 1)
    expect(html).toContain(source)
    expect(html).toContain('heatmap-tooltip-label')
    expect(html).toContain('heatmap-tooltip-value')
    expect(html).not.toContain('nowrap')
  })

  it('escapes stock content before placing it in an HTML tooltip', () => {
    const html = formatHeatmapTooltipHtml({ ...heatmapFixture.stocks[0], name: '<script>alert(1)</script>' }, 'changePercent', 2)
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('uses clear High, Medium, and Low legend levels', () => {
    expect(legend).toContain('label="High"')
    expect(legend).toContain('label="Medium"')
    expect(legend).toContain('label="Low"')
    expect(legend).toContain('台股紅漲、綠跌')
  })

  it('presents Top 50 and Top 100 as an accessible segment control', () => {
    expect(toolbar).toContain('heatmap-segment-control')
    expect(toolbar).toContain('role="group"')
    expect(toolbar).toContain('aria-pressed={stockLimit === limit}')
    expect(toolbar).toContain('[50, 100]')
  })

  it('keeps heatmap routing and lazy data boundaries unchanged', () => {
    expect(heatmap).toContain('navigate(`/industries/${node.industryId}`)')
    expect(heatmap).toContain('navigate(`/stock/${node.symbol}`)')
    expect(heatmap).not.toContain('fetch(')
    expect(heatmap).not.toContain('stockHistory')
  })

  it('uses ECharts confined positioning together with the collision callback', () => {
    expect(heatmap).toContain('confine: true')
    expect(heatmap).toContain('position: (')
    expect(heatmap).toContain('point: readonly number[]')
    expect(heatmap).toContain('resolveHeatmapTooltipPosition')
    expect(heatmap).toContain('max-width:min(320px,calc(100vw - 32px))')
    expect(heatmap).toContain("triggerOn: 'mousemove|click'")
    expect(heatmap).toContain('enterable: true')
  })

  it.each([
    { name: 'right edge', point: [490, 120], expected: [358, 132] },
    { name: 'bottom edge', point: [200, 390], expected: [212, 298] },
    { name: 'bottom-right corner', point: [490, 390], expected: [358, 298] },
    { name: 'top-left corner', point: [0, 0], expected: [12, 12] },
  ])('keeps the $name tooltip inside the heatmap', ({ point, expected }) => {
    expect(resolveHeatmapTooltipPosition(point, {
      contentSize: [120, 80],
      viewSize: [500, 400],
    })).toEqual(expected)
  })

  it('keeps a 320px tooltip inside a 375px mobile viewport', () => {
    const [x, y] = resolveHeatmapTooltipPosition([360, 620], {
      contentSize: [320, 180],
      viewSize: [375, 640],
    })
    expect(x).toBeGreaterThanOrEqual(0)
    expect(y).toBeGreaterThanOrEqual(0)
    expect(x + 320).toBeLessThanOrEqual(375)
    expect(y + 180).toBeLessThanOrEqual(640)
  })

  it('also confines the tooltip to the browser viewport when the chart is partially visible', () => {
    const [x, y] = resolveHeatmapTooltipPosition([350, 300], {
      contentSize: [160, 120],
      viewSize: [400, 420],
    }, {
      left: 80,
      top: 300,
      width: 375,
      height: 640,
    })
    expect(80 + x + 160).toBeLessThanOrEqual(375)
    expect(300 + y + 120).toBeLessThanOrEqual(640)
  })

  it('never returns NaN or negative coordinates for invalid dimensions', () => {
    const position = resolveHeatmapTooltipPosition(
      [Number.NaN, Number.POSITIVE_INFINITY],
      { contentSize: [Number.NaN, -10], viewSize: [Number.NaN, 0] },
    )
    expect(position.every((value) => Number.isFinite(value) && value >= 0)).toBe(true)
  })
})
