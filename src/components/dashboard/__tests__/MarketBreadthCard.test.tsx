import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { buildMarketBreadthModel, MarketBreadthCard } from '../MarketBreadthCard'
import { heatmapFixture, marketFixture } from './dashboardFixtures'

describe('MarketBreadthCard', () => {
  it('calculates breadth ratios and strong/weak move counts', () => {
    const model = buildMarketBreadthModel(marketFixture, heatmapFixture)
    expect(model.total).toBe(1030)
    expect(model.advancePercent + model.declinePercent + model.unchangedPercent).toBeCloseTo(100)
    expect(model.gainAboveThree).toBe(1)
    expect(model.declineBelowThree).toBe(1)
    expect(model.label).toBe('偏多')
  })

  it('does not invent counts when breadth inputs are missing', () => {
    const model = buildMarketBreadthModel({
      ...marketFixture,
      advanceCount: null,
      declineCount: null,
      unchangedCount: null,
    }, null)
    expect(model.total).toBe(0)
    expect(model.advance).toBeNull()
    expect(model.label).toBe('資料不足')
  })

  it('labels approximation as derived rather than official limit counts', () => {
    const html = renderToStaticMarkup(<MarketBreadthCard market={marketFixture} heatmap={heatmapFixture} loading={false} />)
    expect(html).toContain('衍生統計')
    expect(html).toContain('不是證交所官方漲停／跌停家數')
  })

  it('renders stale status visibly', () => {
    const html = renderToStaticMarkup(
      <MarketBreadthCard market={{ ...marketFixture, status: 'partial' }} heatmap={{ ...heatmapFixture, status: 'stale' }} loading={false} />,
    )
    expect(html).toContain('data-state="stale"')
  })
})
