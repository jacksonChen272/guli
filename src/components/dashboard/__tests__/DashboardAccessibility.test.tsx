import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('Dashboard accessibility', () => {
  const commandCenter = source('../MarketCommandCenter.tsx')
  const breadth = source('../MarketBreadthCard.tsx')
  const layout = source('../DashboardWidgetLayout.tsx')
  const styles = source('../../../styles/index.css')

  it('provides labels for refresh, chart, and toggle controls', () => {
    expect(commandCenter).toContain('aria-label="重新讀取 Dashboard 資料"')
    expect(breadth).toContain('aria-label={`上漲')
    expect(breadth).toContain('aria-pressed={active}')
    expect(layout).toContain('aria-label=')
  })

  it('does not communicate direction by color alone', () => {
    expect(commandCenter).toContain("'上漲'")
    expect(commandCenter).toContain("'下跌'")
    expect(breadth).toContain('label="上漲"')
    expect(breadth).toContain('label="下跌"')
  })

  it('uses 44px controls and respects reduced motion', () => {
    expect(layout).toContain('h-11 w-11')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
    expect(styles).toContain('transition-duration: .01ms')
  })
})
