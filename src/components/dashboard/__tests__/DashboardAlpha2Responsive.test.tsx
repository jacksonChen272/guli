import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboard = readFileSync(new URL('../../../pages/Dashboard.tsx', import.meta.url), 'utf8')
const opportunities = readFileSync(new URL('../TodayOpportunitiesSection.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../../../styles/index.css', import.meta.url), 'utf8')

describe('Dashboard alpha.2 responsive contract', () => {
  it('stacks breadth and heatmap below xl and uses 4:8 on desktop', () => {
    expect(dashboard).toContain('grid-cols-1')
    expect(dashboard).toContain('xl:col-span-4')
    expect(dashboard).toContain('xl:col-span-8')
  })

  it('uses 2+1 tablet opportunities and a single mobile column', () => {
    expect(opportunities).toContain('md:grid-cols-2 xl:grid-cols-3')
    expect(opportunities).toContain('md:col-span-2 xl:col-span-1')
  })

  it('guards 375px content from horizontal overflow and preserves safe area', () => {
    expect(styles).toContain('overflow-x: clip')
    expect(styles).toContain('env(safe-area-inset-bottom)')
    expect(dashboard).toContain('min-w-0')
  })
})
