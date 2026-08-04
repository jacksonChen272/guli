import { describe, expect, it } from 'vitest'
import { DashboardLayoutRepository, DEFAULT_DASHBOARD_WIDGET_ORDER } from '../DashboardLayoutRepository'
import type { RecentSearchStorage } from '../RecentSearchRepository'

class MemoryStorage implements RecentSearchStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

describe('Dashboard layout beta compatibility', () => {
  it('falls back safely when an older payload contains malformed JSON', () => {
    const storage = new MemoryStorage()
    storage.setItem('guli-dashboard-widget-layout-v1', '{')
    expect(new DashboardLayoutRepository(storage).getOrder()).toEqual(DEFAULT_DASHBOARD_WIDGET_ORDER)
  })

  it('restores the default order after clearing the saved layout', () => {
    const repository = new DashboardLayoutRepository(new MemoryStorage())
    repository.save([...DEFAULT_DASHBOARD_WIDGET_ORDER].reverse())
    expect(repository.reset()).toEqual(DEFAULT_DASHBOARD_WIDGET_ORDER)
    expect(repository.getOrder()).toEqual(DEFAULT_DASHBOARD_WIDGET_ORDER)
  })

  it('stays usable when browser storage is blocked', () => {
    const storage: RecentSearchStorage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    }
    const repository = new DashboardLayoutRepository(storage)
    expect(repository.getOrder()).toEqual(DEFAULT_DASHBOARD_WIDGET_ORDER)
    expect(repository.save(['watchlist'])).toEqual([
      'watchlist',
      ...DEFAULT_DASHBOARD_WIDGET_ORDER.filter((item) => item !== 'watchlist'),
    ])
    expect(repository.reset()).toEqual(DEFAULT_DASHBOARD_WIDGET_ORDER)
  })
})
