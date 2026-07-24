import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('Dashboard 3.0 beta release safeguards', () => {
  const dashboard = source('../../../pages/Dashboard.tsx')
  const statusBar = source('../DashboardDataStatusBar.tsx')
  const layout = source('../DashboardWidgetLayout.tsx')
  const errorBoundary = source('../DashboardWidgetErrorBoundary.tsx')
  const dashboardData = source('../../../hooks/useTodayDashboardData.ts')
  const industries = source('../../industry/IndustryRotationPreview.tsx')
  const search = source('../../search/GlobalStockSearch.tsx')
  const deferredWidget = source('../DashboardDeferredWidget.tsx')
  const app = source('../../../App.tsx')
  const vite = source('../../../../vite.config.ts')

  it('exposes the beta Dashboard marker without changing the application version', () => {
    expect(dashboard).toContain('data-dashboard-version="dashboard-3.0-beta.1"')
    expect(dashboard).toContain('Dashboard 3.0 Beta')
  })

  it('distinguishes Partial from Stale and Mixed coverage', () => {
    expect(statusBar).toContain("'Official' | 'Mixed' | 'Partial' | 'Stale' | 'Missing'")
    expect(statusBar).toContain("platform.stocks === 'Partial'")
    expect(statusBar).toContain("resourceStatus === 'stale'")
  })

  it('isolates every draggable widget with a retryable error state', () => {
    expect(layout).toContain('<DashboardWidgetErrorBoundary widgetId={id}>')
    expect(errorBoundary).toContain('getDerivedStateFromError')
    expect(errorBoundary).toContain('重新載入區塊')
    expect(errorBoundary).toContain('role="alert"')
  })

  it('keeps GitHub Pages base and one routed Dashboard', () => {
    expect(vite).toContain("base: '/guli/'")
    expect(app.match(/<Dashboard\/>/g)).toHaveLength(1)
    expect(app).not.toContain('fetch(')
  })

  it('never uses a smaller partial dataset as the coverage denominator', () => {
    expect(dashboardData).toContain('const coverageUniverse = Math.max(')
    expect(dashboardData).toContain('totalCommonStocks: coverageUniverse')
  })

  it('keeps Dashboard stock links and the global search input at a 44px target', () => {
    expect(industries).not.toContain('min-h-9')
    expect(industries).toContain('min-h-11')
    expect(search).toContain('className="h-full w-full')
  })

  it('loads below-the-fold widgets shortly before they enter the viewport', () => {
    expect(dashboard).toContain('lazy(() => import(')
    expect(layout).toContain('<DashboardDeferredWidget>')
    expect(deferredWidget).toContain("rootMargin: '480px 0px'")
    expect(deferredWidget).toContain('observer.disconnect()')
  })
})
