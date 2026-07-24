import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildMarketBreadthModel } from '../MarketBreadthCard'
import { heatmapFixture, marketFixture } from './dashboardFixtures'

const source = readFileSync(new URL('../MarketBreadthCard.tsx', import.meta.url), 'utf8')

describe('MarketBreadth interactions', () => {
  it('counts inclusive ±3% thresholds', () => {
    const heatmap = {
      ...heatmapFixture,
      stocks: heatmapFixture.stocks.map((stock, index) => ({
        ...stock,
        changePercent: index === 0 ? 3 : index === 1 ? -3 : 0,
      })),
    }
    const model = buildMarketBreadthModel(marketFixture, heatmap)
    expect(model.gainAboveThree).toBe(1)
    expect(model.declineBelowThree).toBe(1)
  })

  it('provides keyboard-sized count and percentage toggles', () => {
    expect(source).toContain("aria-pressed={active}")
    expect(source).toContain('min-h-11')
    expect(source).toContain("setView('count')")
    expect(source).toContain("setView('percent')")
  })

  it('labels 9.5 percent counts as derived rather than official limits', () => {
    expect(source).toContain('衍生統計')
    expect(source).toContain('不是證交所官方漲停／跌停家數')
  })
})
