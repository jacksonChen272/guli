import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboard = readFileSync(new URL('../../../pages/Dashboard.tsx', import.meta.url), 'utf8')
const command = readFileSync(new URL('../MarketCommandCenter.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../../../styles/index.css', import.meta.url), 'utf8')

describe('Dashboard alpha.3 visual regression contract', () => {
  it('keeps the single Dashboard 3.0 hierarchy and identifies the alpha.3 surface', () => {
    expect(dashboard).toContain('data-dashboard-version="dashboard-3.0-alpha.3"')
    expect(dashboard.match(/<MarketCommandCenter/g)).toHaveLength(1)
    expect(dashboard.indexOf('<MarketCommandCenter')).toBeLessThan(dashboard.indexOf('<MarketBreadthCard'))
    expect(dashboard.indexOf('<MarketBreadthCard')).toBeLessThan(dashboard.indexOf('<TodayOpportunitiesSection'))
  })

  it('preserves a stable visual token contract for cards and the hero', () => {
    expect(styles).toContain('border-radius: 18px')
    expect(styles).toContain('.dashboard-command-center')
    expect(styles).toContain('radial-gradient(circle at 12% 0%')
    expect(styles).toContain('.dashboard-card-header')
  })

  it('renders the investor-facing Market Overview and three required actions', () => {
    expect(command).toContain('title="Market Overview"')
    expect(command).toContain('查看市場分析')
    expect(command).toContain('產業分析')
    expect(command).toContain('快速選股')
  })

  it('does not introduce a second data architecture or direct network access', () => {
    expect(command).not.toContain('Repository')
    expect(command).not.toContain('fetch(')
    expect(dashboard).toContain('useTodayDashboardData')
    expect(dashboard).not.toContain('fetch(')
  })
})
