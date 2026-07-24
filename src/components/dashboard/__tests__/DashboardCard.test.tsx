import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DashboardCard } from '../DashboardCard'
import { DashboardDataState } from '../DashboardDataState'

describe('Dashboard card system', () => {
  it('connects the title and section through accessible labels', () => {
    const html = renderToStaticMarkup(<DashboardCard title="測試卡片"><p>內容</p></DashboardCard>)
    expect(html).toContain('aria-labelledby=')
    expect(html).toContain('data-dashboard-card')
    expect(html).toContain('測試卡片')
  })

  it('shows stale status and updated metadata', () => {
    const html = renderToStaticMarkup(
      <DashboardCard title="市場資料" stale updatedAt="2026-07-22T08:00:00.000Z"><p>內容</p></DashboardCard>,
    )
    expect(html).toContain('資料可能過期')
    expect(html).toContain('data-state="stale"')
    expect(html).toContain('最後更新')
  })

  it('renders explicit loading, error, and empty states', () => {
    expect(renderToStaticMarkup(<DashboardDataState loading><p>ready</p></DashboardDataState>)).toContain('role="status"')
    expect(renderToStaticMarkup(<DashboardDataState loading={false} error="讀取失敗"><p>ready</p></DashboardDataState>)).toContain('role="alert"')
    expect(renderToStaticMarkup(<DashboardDataState loading={false} empty><p>ready</p></DashboardDataState>)).toContain('目前沒有可顯示的資料')
  })
})
