import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const command = readFileSync(new URL('../StockCommandCenter.tsx', import.meta.url), 'utf8')
const status = readFileSync(new URL('../StockDataStatusBar.tsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('../../../pages/StockDetailWithSnapshot.tsx', import.meta.url), 'utf8')

describe('Stock Page 3.0 accessibility', () => {
  it('has labelled regions and non-color direction text', () => {
    expect(command).toContain('aria-label="今日規則式研究結論"')
    expect(command).toContain('技術趨勢')
    expect(command).toContain('風險層級')
    expect(page).toContain('aria-label="決策與風險說明"')
  })

  it('uses native keyboard-operable details and visible focus ring', () => {
    expect(status).toContain('<details')
    expect(status).toContain('focus-visible:ring-2')
  })
})
