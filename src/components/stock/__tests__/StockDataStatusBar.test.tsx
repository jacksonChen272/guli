import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../StockDataStatusBar.tsx', import.meta.url), 'utf8')

describe('StockDataStatusBar', () => {
  it('is collapsible and exposes its expanded state', () => {
    expect(source).toContain('<details')
    expect(source).toContain('aria-expanded={open}')
    expect(source).toContain('aria-controls={panelId}')
  })

  it('lists explicit sources and data dates', () => {
    expect(source).toContain('item.statusLabel')
    expect(source).toContain('item.tradeDate')
    expect(source).toContain("item.status !== 'missing'")
  })

  it('deduplicates warnings and provides retry without fake values', () => {
    expect(source).toContain('new Set(messages.filter(Boolean))')
    expect(source).toContain('重新讀取')
    expect(source).toContain('NaN')
  })
})
