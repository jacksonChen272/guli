import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')
const app = read('src/App.tsx')
const page = read('src/pages/StockDetailWithSnapshot.tsx')
const analysis = read('src/components/stock/StockTechnicalAnalysis.tsx')
const chart = read('src/components/charts/lightweight/CandlestickPriceChart.tsx')
const hook = read('src/hooks/useStockAnalysisData.ts')

describe('stock history UI wiring', () => {
  it('has exactly one stock symbol route', () => { expect(app.match(/path="\/stock\/:symbol"/g)).toHaveLength(1) })
  it('routes to the unified Stock Page 3.0 page', () => { expect(app).toContain('<StockDetailWithSnapshot/>'); expect(page).not.toContain('<StockDetail/>') })
  it('uses the Stock Page 3.0 information order while retaining existing sections', () => {
    const sections = ['<StockPageHeader', '<StockDataStatusBar', '<StockCommandCenter', '<StockCoreScoreStrip', '<StockPriceAnalysisSection', '<StockDecisionExplanation', '<StockRiskAssessment', '<StockNarrativePanel', '<PriceStructurePanel', '<InstitutionalAnalysis', '<StockIndustryComparison', '<StockDecisionTraceEntry', '<StockDataSources']
    sections.reduce((previous, section) => {
      const current = page.lastIndexOf(section)
      expect(current).toBeGreaterThan(previous)
      return current
    }, -1)
  })
  it('uses one consolidated data warning surface', () => {
    expect(page).not.toContain('<StockAnalysisDataGuard')
    expect(page).toContain('messages={[...data.errors, ...data.warnings]}')
  })
  it('shows diagnostics in development only', () => { expect(analysis).toContain('import.meta.env.DEV'); expect(analysis).toContain('stock-history-dev-diagnostics') })
  it('gets the resolved URL once through the unified hook', () => { expect(hook).toContain('repositoryHub.stockHistory.getResolvedUrl(normalizedSymbol)'); expect(analysis).not.toContain('repositoryHub') })
  it('reports the actual chart mount lifecycle', () => { expect(chart).toContain('onMountedChange?.(true)'); expect(chart).toContain('onMountedChange?.(false)') })
  it('keeps Lightweight Charts lazy loaded', () => { expect(analysis).toContain("lazy(() => import('../charts/lightweight/CandlestickPriceChart'))"); expect(chart).toContain("import('lightweight-charts')") })
})
