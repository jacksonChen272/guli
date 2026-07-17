import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')
const chart = read('src/components/charts/lightweight/CandlestickPriceChart.tsx')
const stockPage = read('src/components/stock/StockTechnicalAnalysis.tsx')
const vite = read('vite.config.ts')
const validator = read('scripts/validate-public-json.mjs')

describe('professional chart and publish guard wiring', () => {
  it('loads the library dynamically only from the stock chart', () => { expect(chart).toContain("import('lightweight-charts')"); expect(stockPage).toContain('lazy(() => import(') })
  it('uses ResizeObserver and disconnects it', () => { expect(chart).toContain('new ResizeObserver'); expect(chart).toContain('resizeObserver?.disconnect()') })
  it('removes chart on unmount', () => { expect(chart).toContain('chart?.remove()') })
  it('keeps touch pan and pinch controls', () => { expect(chart).toContain('horzTouchDrag: true'); expect(chart).toContain('pinch: true') })
  it('keeps red-up and green-down colors', () => { expect(chart).toContain("upColor: '#ef4444'"); expect(chart).toContain("downColor: '#22c55e'") })
  it('creates a standalone lightweight chunk', () => { expect(vite).toContain("return 'lightweight-charts'") })
  it('keeps chart container min-width zero for 375px layouts', () => { expect(read('src/components/charts/lightweight/LightweightChartContainer.tsx')).toContain('min-w-0 overflow-hidden') })
  it('validates conflict markers and replacement characters', () => { expect(validator).toContain('<<<<<<<|=======|>>>>>>>'); expect(validator).toContain("text.includes('\\uFFFD')") })
  it('validates duplicate trade dates', () => { expect(validator).toContain('重複交易日期') })
  it('does not mutate Decision Engine weights', () => { expect(stockPage).not.toContain('decision-v1.0'); expect(stockPage).not.toContain('DecisionEngine') })
})
