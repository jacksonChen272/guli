import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboard = readFileSync(new URL('../../../pages/Dashboard.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../../../styles/index.css', import.meta.url), 'utf8')

describe('Dashboard alpha.2 above-fold order', () => {
  it('uses the requested fixed information order before draggable widgets', () => {
    const command = dashboard.indexOf('<MarketCommandCenter')
    const breadth = dashboard.indexOf('<MarketBreadthCard')
    const heatmap = dashboard.indexOf('<MarketHeatmapSection')
    const opportunities = dashboard.indexOf('<TodayOpportunitiesSection')
    const widgets = dashboard.indexOf('<DashboardWidgetLayout')
    expect(command).toBeGreaterThan(0)
    expect(breadth).toBeGreaterThan(command)
    expect(heatmap).toBeGreaterThan(breadth)
    expect(opportunities).toBeGreaterThan(heatmap)
    expect(widgets).toBeGreaterThan(opportunities)
  })

  it('targets a compact desktop command center without fixed mobile height', () => {
    expect(styles).toContain('.dashboard-command-center')
    expect(styles).toContain('min-height: 420px')
    expect(styles).not.toContain('height: 480px')
  })
})
