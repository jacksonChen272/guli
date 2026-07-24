import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const heatmap = readFileSync(new URL('../MarketHeatmap.tsx', import.meta.url), 'utf8')
const toolbar = readFileSync(new URL('../MarketHeatmapToolbar.tsx', import.meta.url), 'utf8')
const section = readFileSync(new URL('../MarketHeatmapSection.tsx', import.meta.url), 'utf8')

describe('MarketHeatmap modes', () => {
  it('keeps the existing lazy heatmap and industry/stock modes', () => {
    expect(section).toContain("lazy(() => import('./MarketHeatmap')")
    expect(toolbar).toContain('<option value="industry">產業</option>')
    expect(toolbar).toContain('<option value="stock">個股</option>')
  })

  it('supports Top 50 and Top 100 with unavailable metrics disabled', () => {
    expect(heatmap).toContain("useState<50 | 100>(50)")
    expect(toolbar).toContain('[50, 100]')
    expect(toolbar).toContain('disabled={!technicalAvailable}')
    expect(toolbar).toContain('disabled={!decisionAvailable}')
  })

  it('retains both detail routes and has no history preload or direct fetch', () => {
    expect(heatmap).toContain('navigate(`/industries/${node.industryId}`)')
    expect(heatmap).toContain('navigate(`/stock/${node.symbol}`)')
    expect(heatmap).not.toContain('stockHistory')
    expect(heatmap).not.toContain('fetch(')
  })
})
