import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const status = readFileSync(new URL('../DashboardDataStatusBar.tsx', import.meta.url), 'utf8')
const command = readFileSync(new URL('../MarketCommandCenter.tsx', import.meta.url), 'utf8')
const breadth = readFileSync(new URL('../MarketBreadthCard.tsx', import.meta.url), 'utf8')
const toolbar = readFileSync(new URL('../MarketHeatmapToolbar.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../../../styles/index.css', import.meta.url), 'utf8')

describe('Dashboard alpha.2 accessibility', () => {
  it('supports keyboard disclosures and toggle state', () => {
    expect(status).toContain('aria-expanded={expanded}')
    expect(status).toContain('aria-controls={detailsId}')
    expect(breadth).toContain('aria-pressed={active}')
    expect(toolbar).toContain('aria-pressed={stockLimit === limit}')
  })

  it('uses explicit text for direction and risk instead of color alone', () => {
    expect(command).toContain('趨勢方向：')
    expect(command).toContain("market && market.change > 0 ? '上漲'")
    expect(breadth).toContain('偏多')
    expect(breadth).toContain('偏空')
  })

  it('keeps 44px targets and reduced-motion support', () => {
    expect(breadth).toContain('min-h-11')
    expect(toolbar).toContain('min-h-11')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
