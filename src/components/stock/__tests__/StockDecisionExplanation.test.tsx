import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../StockDecisionExplanation.tsx', import.meta.url), 'utf8')

describe('StockDecisionExplanation', () => {
  it('uses existing factor contributions and source evidence', () => {
    expect(source).toContain('factor.contribution')
    expect(source).toContain('factor.sourceType')
    expect(source).toContain('factor.evidence')
  })

  it('renders four factor groups only when populated', () => {
    for (const label of ['正向因子', '中性因子', '扣分因子', '資料不足因子']) {
      expect(source).toContain(label)
    }
    expect(source).toContain('if (!items.length) return null')
  })

  it('keeps the existing Decision Trace entry point', () => {
    expect(source).toContain('開啟 Decision Trace')
  })
})
