import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
describe('Market Heatmap dashboard wiring', () => {
  const dashboard = source('../../../pages/Dashboard.tsx')
  const heatmap = source('../MarketHeatmap.tsx')
  it('keeps the single Dashboard heatmap placement', () => { expect(dashboard.indexOf('<MarketHeatmap')).toBeGreaterThan(dashboard.indexOf('<TodayRecommendations')); expect(dashboard.indexOf('<MarketHeatmap')).toBeLessThan(dashboard.indexOf('<IndustryRotationPreview')) })
  it('lazy loads the existing Heatmap', () => expect(dashboard).toContain("lazy(() => import('../components/dashboard/MarketHeatmap')"))
  it('loads through RepositoryHub rather than direct fetch', () => { expect(source('../../../hooks/useTodayDashboardData.ts')).toContain('repositoryHub.marketHeatmap.getLatest()'); expect(heatmap).not.toContain('fetch(') })
  it('uses shared ECharts and cleans ResizeObserver', () => { expect(heatmap).toContain("from '../../lib/echarts'"); expect(heatmap).toContain('observer.disconnect()') })
  it('keeps GitHub Pages base and basename', () => { expect(source('../../../../vite.config.ts')).toContain("base: '/guli/'"); expect(source('../../../main.tsx')).toContain('basename="/guli"') })
  it('generates Heatmap after Screener in daily workflow', () => { const workflow = source('../../../../.github/workflows/twse-daily-update.yml'); expect(workflow.indexOf('npm run heatmap:generate')).toBeGreaterThan(workflow.indexOf('npm run screener:generate')) })
  it('validates Heatmap output and uses atomic JSON writes', () => { expect(source('../../../../scripts/validate-public-json.mjs')).toContain('validateMarketHeatmapDataset'); expect(source('../../../../scripts/generate-market-heatmap.mjs')).toContain('rename(temporary, file)') })
  it('never uses random Heatmap data', () => expect(source('../../../../scripts/generate-market-heatmap.mjs')).not.toContain('Math.random'))
})
