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
  it('routes to the unified Stock Analysis 2.0 page', () => { expect(app).toContain('<StockDetailWithSnapshot/>'); expect(page).not.toContain('<StockDetail/>') })
  it('uses the required investor information order', () => { const sections = ['<StockAnalysisDataGuard', '<StockAnalysisHero', '<StockCoreScores', '<StockNarrativePanel', '<StockTechnicalAnalysis', '<PriceStructurePanel', '<InstitutionalAnalysis', '<StockIndustryComparison', '<StockRiskAssessment', '<StockDecisionTraceEntry', '<StockDataSources']; sections.reduce((previous, section) => { const current = page.indexOf(section); expect(current).toBeGreaterThan(previous); return current }, -1) })
  it('shows diagnostics in development only', () => { expect(analysis).toContain('import.meta.env.DEV'); expect(analysis).toContain('stock-history-dev-diagnostics') })
  it('gets the resolved URL once through the unified hook', () => { expect(hook).toContain('repositoryHub.stockHistory.getResolvedUrl(normalizedSymbol)'); expect(analysis).not.toContain('repositoryHub') })
  it('reports the actual chart mount lifecycle', () => { expect(chart).toContain('onMountedChange?.(true)'); expect(chart).toContain('onMountedChange?.(false)') })
  it('keeps Lightweight Charts lazy loaded', () => { expect(analysis).toContain("lazy(() => import('../charts/lightweight/CandlestickPriceChart'))"); expect(chart).toContain("import('lightweight-charts')") })
})
