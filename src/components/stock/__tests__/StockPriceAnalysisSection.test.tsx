import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../StockPriceAnalysisSection.tsx', import.meta.url), 'utf8')
const technical = readFileSync(new URL('../StockTechnicalAnalysis.tsx', import.meta.url), 'utf8')

describe('StockPriceAnalysisSection', () => {
  it('reuses the existing chart and price-structure result in an 8/4 split', () => {
    expect(source).toContain('<StockTechnicalAnalysis')
    expect(source).toContain('<StockKeyLevelsCard')
    expect(source).toContain('xl:col-span-8')
    expect(source).toContain('xl:col-span-4')
  })

  it('keeps Lightweight Charts lazy loaded with required ranges', () => {
    expect(technical).toContain("lazy(() => import('../charts/lightweight/CandlestickPriceChart'))")
    for (const range of ["'1M'", "'3M'", "'6M'", "'1Y'", 'ALL']) expect(technical).toContain(range)
  })
})
