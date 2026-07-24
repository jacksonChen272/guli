import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const command = readFileSync(new URL('../MarketCommandCenter.tsx', import.meta.url), 'utf8')
const countUp = readFileSync(new URL('../DashboardCountUpValue.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../../../styles/index.css', import.meta.url), 'utf8')

describe('Dashboard alpha.3 typography', () => {
  it('uses tabular financial numbers across the Dashboard', () => {
    expect(styles).toContain('font-variant-numeric: tabular-nums')
    expect(countUp).toContain('data-numeric')
    expect(command).toContain('tabular-nums')
  })

  it('sets the primary metric scale to the requested 32 to 40 pixel range', () => {
    expect(styles).toContain("font-size: clamp(2rem, 3vw, 2.5rem)")
    expect(command).toContain('dashboard-metric-primary')
  })

  it('uses a consistent 12 pixel updated-time treatment', () => {
    expect(styles).toMatch(/\.dashboard-alpha3 \.dashboard-updated[\s\S]*font-size: \.75rem/)
    expect(command).toContain('dashboard-updated')
  })

  it('formats the hero units as 億元, points, and percent without raw units', () => {
    expect(command).toContain('億元')
    expect(command).toContain("' 點'")
    expect(command).toContain("changePercent, '%'")
  })
})
