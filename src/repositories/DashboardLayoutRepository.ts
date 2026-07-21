import type { DashboardWidgetId } from '../types/dashboardIntelligence'
import type { RecentSearchStorage } from './RecentSearchRepository'

export const DEFAULT_DASHBOARD_WIDGET_ORDER: DashboardWidgetId[] = [
  'hero', 'sentiment', 'summary', 'hot-stocks', 'recent-search', 'watchlist', 'recommendations',
  'heatmap', 'industry-rotation', 'technical-opportunities', 'twse-rankings', 'today-events', 'data-coverage',
]

const STORAGE_KEY = 'guli-dashboard-widget-layout-v1'
const browserStorage = (): RecentSearchStorage | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

export class DashboardLayoutRepository {
  constructor(private readonly storage: RecentSearchStorage | null = browserStorage()) {}
  getOrder(): DashboardWidgetId[] {
    try {
      const raw: unknown = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? '[]')
      const known = new Set<DashboardWidgetId>(DEFAULT_DASHBOARD_WIDGET_ORDER)
      const saved = Array.isArray(raw) ? raw.filter((item): item is DashboardWidgetId => typeof item === 'string' && known.has(item as DashboardWidgetId)) : []
      return [...new Set(saved), ...DEFAULT_DASHBOARD_WIDGET_ORDER.filter((item) => !saved.includes(item))]
    } catch { return [...DEFAULT_DASHBOARD_WIDGET_ORDER] }
  }
  save(order: DashboardWidgetId[]) {
    const known = new Set(DEFAULT_DASHBOARD_WIDGET_ORDER)
    const normalized = [...new Set(order.filter((item) => known.has(item))), ...DEFAULT_DASHBOARD_WIDGET_ORDER.filter((item) => !order.includes(item))]
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(normalized)) } catch { /* Layout remains usable without persistence. */ }
    return normalized
  }
  reset() { try { this.storage?.removeItem(STORAGE_KEY) } catch { /* Storage may be disabled. */ }; return [...DEFAULT_DASHBOARD_WIDGET_ORDER] }
}

