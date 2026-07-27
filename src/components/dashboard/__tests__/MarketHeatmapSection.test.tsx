import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('MarketHeatmapSection', () => {
  const section = source('../MarketHeatmapSection.tsx')
  const heatmap = source('../MarketHeatmap.tsx')

  it('lazy loads and reuses the existing heatmap implementation', () => {
    expect(section).toContain("lazy(() => import('./MarketHeatmap')")
    expect(section).toContain('<MarketHeatmap dataset={dataset} embedded')
  })

  it('provides loading, empty, error, and stale states', () => {
    expect(section).toContain('<DashboardDataState')
    expect(section).toContain('DashboardSkeleton')
    expect(section).toContain("dataset?.status === 'stale'")
    expect(section).toContain('emptyTitle=')
  })

  it('supports both display modes and existing routes', () => {
    expect(heatmap).toContain("useState<HeatmapDisplayMode>('industry')")
    expect(heatmap).toContain('onModeChange=')
    expect(heatmap).toContain('navigate(`/industries/${node.industryId}`)')
    expect(heatmap).toContain('navigate(`/stock/${node.symbol}`)')
  })

  it('does not preload stock history or fetch directly', () => {
    expect(section).not.toContain('fetch(')
    expect(heatmap).not.toContain('fetch(')
    expect(section).not.toContain('stockHistory')
    expect(heatmap).not.toContain('stockHistory')
  })
})
