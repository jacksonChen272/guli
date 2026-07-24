import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../MarketCommandCenter.tsx', import.meta.url), 'utf8')

describe('MarketCommandCenter density', () => {
  it('keeps the compact first-fold content and no duplicate platform status', () => {
    expect(source).toContain('summaryItems.slice(0, 3)')
    expect(source).toContain('dashboard-command-center')
    expect(source).not.toContain('DataPlatformStatus')
    expect(source).not.toContain('StatusBadge')
  })

  it('keeps expandable reasoning and at most three operation environment items', () => {
    expect(source).toContain('<details')
    expect(source).toContain('為什麼？')
    expect(source).toContain('getOperationEnvironment(narrative.stance).slice(0, 3)')
  })

  it('shows real previous-session and sparkline data without random values', () => {
    expect(source).toContain("market?.tradingHistory.at(-2)")
    expect(source).toContain('<MiniMarketSparkline')
    expect(source).not.toContain('Math.random')
  })
})
