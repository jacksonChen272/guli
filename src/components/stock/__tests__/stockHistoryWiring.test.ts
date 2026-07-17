import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')
const app = read('src/App.tsx')
const page = read('src/pages/StockDetailWithSnapshot.tsx')
const analysis = read('src/components/stock/StockTechnicalAnalysis.tsx')
const chart = read('src/components/charts/lightweight/CandlestickPriceChart.tsx')

describe('stock history UI wiring', () => {
  it('has exactly one stock symbol route', () => { expect(app.match(/path="\/stock\/:symbol"/g)).toHaveLength(1) })
  it('routes to the snapshot wrapper only', () => { expect(app).toContain('<StockDetailWithSnapshot/>'); expect(app).not.toContain('path="/stock/:symbol" element={<StockDetail/>') })
  it('mounts technical analysis directly after score overview', () => { expect(page.indexOf('<StockScoreOverview')).toBeLessThan(page.indexOf('<StockTechnicalAnalysis')); expect(page.indexOf('<StockTechnicalAnalysis')).toBeLessThan(page.indexOf('<StockDecisionPanel')) })
  it('shows diagnostics in development only', () => { expect(analysis).toContain('import.meta.env.DEV'); expect(analysis).toContain('stock-history-dev-diagnostics') })
  it('gets the resolved URL through repository', () => { expect(analysis).toContain('repositoryHub.stockHistory.getResolvedUrl(symbol)') })
  it('reports the actual chart mount lifecycle', () => { expect(chart).toContain('onMountedChange?.(true)'); expect(chart).toContain('onMountedChange?.(false)') })
  it('keeps Lightweight Charts lazy loaded', () => { expect(analysis).toContain("lazy(() => import('../charts/lightweight/CandlestickPriceChart'))"); expect(chart).toContain("import('lightweight-charts')") })
})
