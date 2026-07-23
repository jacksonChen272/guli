import { describe, expect, it, vi } from 'vitest'
import { DashboardLayoutRepository, DEFAULT_DASHBOARD_WIDGET_ORDER } from '../DashboardLayoutRepository'
import { RecentSearchRepository, type RecentSearchStorage } from '../RecentSearchRepository'

class MemoryStorage implements RecentSearchStorage { values = new Map<string, string>(); getItem(key: string) { return this.values.get(key) ?? null }; setItem(key: string, value: string) { this.values.set(key, value) }; removeItem(key: string) { this.values.delete(key) } }

describe('RecentSearchRepository', () => {
  it('保存最近搜尋並將最新項目置頂', () => { const repository = new RecentSearchRepository(new MemoryStorage()); repository.record('2330'); expect(repository.record('2454')).toEqual(['2454', '2330']) })
  it('相同代號不重複', () => { const repository = new RecentSearchRepository(new MemoryStorage()); repository.record('2330'); repository.record('2454'); expect(repository.record('2330')).toEqual(['2330', '2454']) })
  it('最多保存 10 筆', () => { const repository = new RecentSearchRepository(new MemoryStorage()); for (let index = 1000; index < 1015; index += 1) repository.record(String(index)); expect(repository.getRecent()).toHaveLength(10) })
  it('拒絕無效代號', () => { const repository = new RecentSearchRepository(new MemoryStorage()); repository.record('2330'); expect(repository.record('台積電')).toEqual(['2330']) })
  it('支援既有字串陣列資料', () => { const storage = new MemoryStorage(); storage.setItem('guli-recent-stock-searches', JSON.stringify(['2330', '2454'])); expect(new RecentSearchRepository(storage).getRecent()).toEqual(['2330', '2454']) })
  it('無效 JSON 安全回傳空陣列', () => { const storage = new MemoryStorage(); storage.setItem('guli-recent-stock-searches', '{'); expect(new RecentSearchRepository(storage).getRecent()).toEqual([]) })
  it('clear 清除資料', () => { const repository = new RecentSearchRepository(new MemoryStorage()); repository.record('2330'); repository.clear(); expect(repository.getRecent()).toEqual([]) })
  it('變更時通知訂閱者', () => { const repository = new RecentSearchRepository(new MemoryStorage()); const listener = vi.fn(); repository.subscribe(listener); repository.record('2330'); expect(listener).toHaveBeenCalledWith(['2330']) })
  it('取消訂閱後不再通知', () => { const repository = new RecentSearchRepository(new MemoryStorage()); const listener = vi.fn(); const unsubscribe = repository.subscribe(listener); unsubscribe(); repository.record('2330'); expect(listener).not.toHaveBeenCalled() })
})

describe('DashboardLayoutRepository', () => {
  it('預設順序符合產品資訊流', () => expect(new DashboardLayoutRepository(new MemoryStorage()).getOrder()).toEqual(DEFAULT_DASHBOARD_WIDGET_ORDER))
  it('保存使用者排序', () => { const repository = new DashboardLayoutRepository(new MemoryStorage()); const next = [...DEFAULT_DASHBOARD_WIDGET_ORDER].reverse(); repository.save(next); expect(repository.getOrder()).toEqual(next) })
  it('忽略未知與重複 widget 並補齊新項目', () => { const storage = new MemoryStorage(); storage.setItem('guli-dashboard-widget-layout-v1', JSON.stringify(['hero', 'hero', 'unknown', 'summary'])); const order = new DashboardLayoutRepository(storage).getOrder(); expect(order.slice(0, 2)).toEqual(['hero', 'summary']); expect(order).toHaveLength(DEFAULT_DASHBOARD_WIDGET_ORDER.length) })
})

