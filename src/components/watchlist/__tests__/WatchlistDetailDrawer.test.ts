import { describe, expect, it } from 'vitest'
import { getWatchlistDrawerSections } from '../WatchlistDetailDrawer'
import { WatchlistDashboardRepository } from '../../../repositories/WatchlistDashboardRepository'
import type { WatchlistDashboardSource } from '../../../repositories/WatchlistDashboardRepository'

describe('Watchlist Detail Drawer', () => {
  it('未選取股票時不提供內容區段', () => expect(getWatchlistDrawerSections(null)).toEqual([]))
  it('型別層保留 Drawer 必要欄位名稱', () => {
    const sections = getWatchlistDrawerSections({} as Parameters<typeof getWatchlistDrawerSections>[0])
    expect(sections).toEqual(expect.arrayContaining(['Decision', '健康', 'Snapshot', '市場', '產業', 'Confidence', '主要正向因子', '主要扣分因子', 'Observation Timeline', 'Decision Trace']))
  })
  it('Repository 類別可供 Drawer 依賴注入', () => {
    const source = {} as WatchlistDashboardSource
    expect(new WatchlistDashboardRepository(source)).toBeInstanceOf(WatchlistDashboardRepository)
  })
})
