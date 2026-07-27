import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const page = readFileSync(new URL('../../../pages/StockDetailWithSnapshot.tsx', import.meta.url), 'utf8')
const hook = readFileSync(new URL('../../../hooks/useStockAnalysisData.ts', import.meta.url), 'utf8')
const app = readFileSync(new URL('../../../App.tsx', import.meta.url), 'utf8')

describe('Stock Page repository contract', () => {
  it('keeps one routed stock page', () => {
    expect(app).toContain("const StockDetailWithSnapshot = lazy(() => import('./pages/StockDetailWithSnapshot')")
    expect(app.split('path="/stock/:symbol"')).toHaveLength(2)
  })

  it('uses the existing aggregate hook and RepositoryHub without component fetch', () => {
    expect(page).toContain('useStockAnalysisData(symbol)')
    expect(page).not.toContain('fetch(')
    expect(hook).toContain('repositoryHub.stockHistory.getHistory(normalizedSymbol)')
    expect(hook).toContain('repositoryHub.decisions.getStockDecision(normalizedSymbol)')
  })
})
