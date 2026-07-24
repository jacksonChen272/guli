import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const countUp = readFileSync(new URL('../DashboardCountUpValue.tsx', import.meta.url), 'utf8')
const skeleton = readFileSync(new URL('../DashboardSkeleton.tsx', import.meta.url), 'utf8')
const command = readFileSync(new URL('../MarketCommandCenter.tsx', import.meta.url), 'utf8')
const dashboard = readFileSync(new URL('../../../pages/Dashboard.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../../../styles/index.css', import.meta.url), 'utf8')

describe('Dashboard alpha.3 animation and accessibility', () => {
  it('animates numeric values once and cleans up its animation frame', () => {
    expect(countUp).toContain('hasAnimated.current')
    expect(countUp).toContain('requestAnimationFrame(update)')
    expect(countUp).toContain('cancelAnimationFrame(frame)')
    expect(countUp).toContain('data-count-up="first-load"')
  })

  it('honors reduced motion for number, card, gauge, and hover motion', () => {
    expect(countUp).toContain("matchMedia?.('(prefers-reduced-motion: reduce)')")
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
    expect(styles).toContain('.dashboard-card:hover')
    expect(styles).toContain('.market-sentiment-gauge__progress { transition: none; }')
  })

  it('uses a restrained fading skeleton rather than a large motion effect', () => {
    expect(skeleton).toContain('dashboard-skeleton-block')
    expect(styles).toContain('@keyframes dashboard-skeleton-fade')
    expect(styles).toContain('1.45s ease-in-out infinite alternate')
  })

  it('labels navigation, summaries, actions, and data time for assistive technology', () => {
    expect(dashboard).toContain('aria-label="麵包屑"')
    expect(dashboard).toContain('aria-current="page"')
    expect(dashboard).toContain('aria-label="Dashboard 資料時間"')
    expect(command).toContain('aria-label="市場快速操作"')
    expect(command).toContain('aria-label="今日市場摘要"')
  })

  it('uses a readable focus order with native links, buttons, details, and summary', () => {
    expect(command).toContain('<Link')
    expect(command).toContain('<details')
    expect(command).toContain('<summary')
    expect(command).not.toContain('tabIndex={-1}')
  })

  it('retains the 375px overflow and safe-area guard', () => {
    expect(styles).toContain('overflow-x: clip')
    expect(styles).toContain('env(safe-area-inset-bottom)')
    expect(styles).toContain('.market-command-actions .dashboard-cta')
    expect(dashboard).toContain('min-w-0')
  })
})
