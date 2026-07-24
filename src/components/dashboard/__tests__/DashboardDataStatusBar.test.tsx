import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DashboardDataStatusBar, resolveDashboardOverallStatus } from '../DashboardDataStatusBar'
import { platformFixture } from './dashboardFixtures'

describe('DashboardDataStatusBar', () => {
  it('classifies all official core datasets with a derived industry as Mixed', () => {
    expect(resolveDashboardOverallStatus(platformFixture, 'success')).toBe('Mixed')
  })

  it('prioritizes stale and missing states', () => {
    expect(resolveDashboardOverallStatus(platformFixture, 'stale')).toBe('Stale')
    expect(resolveDashboardOverallStatus(null, 'error')).toBe('Missing')
  })

  it('renders one accessible disclosure with source and alert metadata', () => {
    const html = renderToStaticMarkup(
      <DashboardDataStatusBar
        platform={{ ...platformFixture, warnings: ['個股資料日較舊'] }}
        resourceStatus="success"
        source="TWSE Official"
        updatedAt="2026-07-22T08:00:00.000Z"
        warnings={['個股資料日較舊']}
      />,
    )
    expect(html).toContain('data-testid="dashboard-data-status-bar"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-controls=')
    expect(html).toContain('1 項提醒')
  })
})
