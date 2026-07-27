import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { DashboardWidgetId } from '../../../types/dashboardIntelligence'
import { mergeVisibleWidgetOrder } from '../DashboardWidgetLayout'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('Dashboard repository and layout contract', () => {
  const hook = source('../../../hooks/useTodayDashboardData.ts')
  const dashboard = source('../../../pages/Dashboard.tsx')
  const layoutRepository = source('../../../repositories/DashboardLayoutRepository.ts')

  it('uses RepositoryHub as the only Dashboard data gateway', () => {
    expect(hook).toContain('repositoryHub.marketHeatmap.getLatest()')
    expect(hook).toContain('repositoryHub.marketSentiment.getLatest()')
    expect(hook).toContain('repositoryHub.institutions.getMarketTotals()')
    expect(hook).not.toContain('fetch(')
  })

  it('keeps fixed first-fold widgets out of the draggable region', () => {
    expect(dashboard).toContain("['hero', 'sentiment', 'summary', 'heatmap']")
    expect(dashboard).toContain('excludedIds={FIXED_WIDGETS}')
  })

  it('preserves excluded widget positions when visible widgets are reordered', () => {
    const order: DashboardWidgetId[] = ['hero', 'sentiment', 'summary', 'hot-stocks', 'recent-search', 'heatmap', 'watchlist']
    const excluded = new Set<DashboardWidgetId>(['hero', 'sentiment', 'summary', 'heatmap'])
    const result = mergeVisibleWidgetOrder(order, ['watchlist', 'recent-search', 'hot-stocks'], excluded)
    expect(result).toEqual(['hero', 'sentiment', 'summary', 'watchlist', 'recent-search', 'heatmap', 'hot-stocks'])
  })

  it('retains the existing localStorage key and does not clear preferences', () => {
    expect(layoutRepository).toContain("const STORAGE_KEY = 'guli-dashboard-widget-layout-v1'")
    expect(dashboard).not.toContain('localStorage.clear')
    expect(dashboard).not.toContain('dashboardLayout.reset')
  })
})
