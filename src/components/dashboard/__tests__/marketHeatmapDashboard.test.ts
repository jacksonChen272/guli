import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
describe('Market Heatmap dashboard wiring', () => {
  const dashboard = source('../../../pages/Dashboard.tsx')
  const section = source('../MarketHeatmapSection.tsx')
  const heatmap = source('../MarketHeatmap.tsx')
  it('uses one fixed first-fold Heatmap section', () => { expect(dashboard).toContain('<MarketHeatmapSection'); expect(dashboard.indexOf('<MarketHeatmapSection')).toBeGreaterThan(dashboard.indexOf('<MarketBreadthCard')); expect(dashboard).not.toContain("import('../components/dashboard/MarketHeatmap')") })
  it('lazy loads the existing mature Heatmap inside its section', () => expect(section).toContain("lazy(() => import('./MarketHeatmap')"))
  it('loads through RepositoryHub rather than component fetch', () => { expect(source('../../../hooks/useTodayDashboardData.ts')).toContain('repositoryHub.marketHeatmap.getLatest()'); expect(section).not.toContain('fetch('); expect(heatmap).not.toContain('fetch(') })
  it('uses shared ECharts and cleans ResizeObserver', () => { expect(heatmap).toContain("from '../../lib/echarts'"); expect(heatmap).toContain('observer.disconnect()') })
  it('routes industry and stock clicks through existing routes', () => { expect(heatmap).toContain('navigate(`/industries/${node.industryId}`)'); expect(heatmap).toContain('navigate(`/stock/${node.symbol}`)') })
  it('keeps GitHub Pages base and basename', () => { expect(source('../../../../vite.config.ts')).toContain("base: '/guli/'"); expect(source('../../../main.tsx')).toContain('basename="/guli"') })
  it('generates Heatmap after Screener and never uses random data', () => { const workflow = source('../../../../.github/workflows/twse-daily-update.yml'); expect(workflow.indexOf('npm run heatmap:generate')).toBeGreaterThan(workflow.indexOf('npm run screener:generate')); expect(source('../../../../scripts/generate-market-heatmap.mjs')).not.toContain('Math.random') })
})
