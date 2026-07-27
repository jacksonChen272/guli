import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('Dashboard responsive contract', () => {
  const dashboard = source('../../../pages/Dashboard.tsx')
  const commandCenter = source('../MarketCommandCenter.tsx')
  const heatmap = source('../MarketHeatmap.tsx')
  const styles = source('../../../styles/index.css')

  it('uses a single-column mobile layout and a 4:8 desktop split', () => {
    expect(dashboard).toContain('grid-cols-1')
    expect(dashboard).toContain('xl:col-span-4')
    expect(dashboard).toContain('xl:col-span-8')
  })

  it('prevents fixed-width overflow at 375px', () => {
    expect(dashboard).toContain('min-w-0')
    expect(commandCenter).toContain('truncate')
    expect(styles).toContain('overflow-x: clip')
  })

  it('keeps reasoning collapsible and heatmap readable on mobile', () => {
    expect(commandCenter).toContain('<details')
    expect(heatmap).toContain("height: 'clamp(360px, 42vw, 500px)'")
  })
})
