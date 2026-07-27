import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const page = readFileSync(new URL('../../../pages/StockDetailWithSnapshot.tsx', import.meta.url), 'utf8')
const header = readFileSync(new URL('../StockPageHeader.tsx', import.meta.url), 'utf8')
const prices = readFileSync(new URL('../StockPriceAnalysisSection.tsx', import.meta.url), 'utf8')

describe('Stock Page 3.0 responsive contract', () => {
  it('prevents horizontal overflow and preserves safe area', () => {
    expect(page).toContain('overflow-x-clip')
    expect(page).toContain('env(safe-area-inset-bottom)')
  })

  it('stacks primary sections before desktop splits', () => {
    expect(header).toContain('xl:grid-cols-')
    expect(prices).toContain('grid-cols-1')
    expect(prices).toContain('xl:grid-cols-12')
  })
})
