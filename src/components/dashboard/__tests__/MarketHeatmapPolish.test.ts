import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { formatHeatmapTooltipHtml } from '../MarketHeatmapTooltip'
import { heatmapFixture } from './dashboardFixtures'

const heatmap = readFileSync(new URL('../MarketHeatmap.tsx', import.meta.url), 'utf8')
const toolbar = readFileSync(new URL('../MarketHeatmapToolbar.tsx', import.meta.url), 'utf8')
const legend = readFileSync(new URL('../MarketHeatmapLegend.tsx', import.meta.url), 'utf8')

describe('Market Heatmap alpha.3 polish', () => {
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
})
