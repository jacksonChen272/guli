import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DashboardCard } from '../DashboardCard'

const styles = readFileSync(new URL('../../../styles/index.css', import.meta.url), 'utf8')

describe('Dashboard card consistency', () => {
  it('uses the common card and header shell for new Dashboard sections', () => {
    const html = renderToStaticMarkup(<DashboardCard title="測試卡片" eyebrow="TEST">內容</DashboardCard>)
    expect(html).toContain('dashboard-card')
    expect(html).toContain('dashboard-card-header')
    expect(html).toContain('dashboard-card-title')
    expect(html).toContain('aria-labelledby=')
  })

  it('defines one consistent radius, border, shadow, and transition', () => {
    expect(styles).toMatch(/\.dashboard-card \{[\s\S]*border-radius: 18px/)
    expect(styles).toMatch(/\.dashboard-card \{[\s\S]*box-shadow: 0 12px 34px/)
    expect(styles).toMatch(/\.dashboard-card \{[\s\S]*transition: transform/)
  })

  it('keeps glow treatment scoped to the hero and primary CTA', () => {
    expect(styles).toContain('.dashboard-command-center')
    expect(styles).toContain('.dashboard-cta--primary')
    expect(styles).not.toMatch(/\.dashboard-card \{[^}]*0 0 34px/)
  })

  it('provides visible keyboard focus through focus-within and focus-visible', () => {
    expect(styles).toContain('.dashboard-card:focus-within')
    expect(styles).toContain('.dashboard-cta:focus-visible')
    expect(styles).toContain('.heatmap-segment-control__button:focus-visible')
  })
})
