import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildDateConsistency } from '../../../hooks/useStockAnalysisData'
import { classifyInstitutionalFlow } from '../InstitutionalAnalysis'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')
const page = read('src/pages/StockDetailWithSnapshot.tsx')
const hook = read('src/hooks/useStockAnalysisData.ts')
const hero = read('src/components/stock/StockAnalysisHero.tsx')
const scores = read('src/components/stock/StockCoreScores.tsx')
const chart = read('src/components/charts/lightweight/CandlestickPriceChart.tsx')
const toolbar = read('src/components/charts/lightweight/ChartToolbar.tsx')

describe('Stock Analysis 2.0 integration', () => {
  it('uses one unified data hook', () => expect(page).toContain('useStockAnalysisData(symbol)'))
  it('does not stack the legacy route data banner over the stock data guard', () => expect(read('src/App.tsx')).toContain('resource="stocks" dataGate={false}'))
  it('does not mount the legacy StockDetail page', () => expect(page).not.toContain('<StockDetail/>'))
  it('does not let child sections access repositories', () => expect(read('src/components/stock/StockTechnicalAnalysis.tsx')).not.toContain('repositoryHub'))
  it('reads every core dataset through RepositoryHub in the hook', () => ['stocks.getOfficialQuote', 'stockHistory.getHistory', 'screener.getTechnicalIndex', 'decisions.getStockDecision', 'stockSnapshots.getBySymbol', 'institutions.getStockInstitutionalContext', 'industryMapping.getBySymbol', 'industrySnapshots.getLatest'].forEach((method) => expect(hook).toContain(method)))
  it('ignores stale symbol requests', () => expect(hook).toContain('currentRequest !== requestId.current'))
  it('exposes explicit loading, partial, success and error states', () => ['loading', 'partial', 'success', 'error'].forEach((state) => expect(hook).toContain(`'${state}'`)))
  it('displays all four independent scores', () => ['GULI 決策分數', '技術分數', '健康分數', '單日快照分數'].forEach((label) => expect(scores).toContain(label)))
  it('warns against averaging scores', () => expect(scores).toContain('不會平均成第五項分數'))
  it('shows official quote fields in the Hero', () => ['open', 'high', 'low', 'tradeVolume', 'tradeValue', 'transactionCount', 'peRatio'].forEach((field) => expect(hero).toContain(`quote?.${field}`)))
  it('uses red-up and green-down text', () => { expect(hero).toContain('text-red-300'); expect(hero).toContain('text-emerald-300') })
  it('builds a GitHub Pages-aware share link', () => expect(hero).toContain('import.meta.env.BASE_URL'))
  it('exports deterministic JSON without external requests', () => { expect(hero).toContain('JSON.stringify'); expect(hero).not.toContain('fetch(') })
  it('keeps MA120 and zones as chart toggles', () => { expect(toolbar).toContain('ma120'); expect(toolbar).toContain('zones') })
  it('shows OHLC volume and four MA values in tooltip', () => ['open', 'high', 'low', 'close', 'volume', 'ma5', 'ma20', 'ma60', 'ma120'].forEach((field) => expect(chart).toContain(field)))
  it('cleans up ResizeObserver and chart subscriptions', () => { expect(chart).toContain('resizeObserver?.disconnect()'); expect(chart).toContain('unsubscribeCrosshairMove'); expect(chart).toContain('chart?.remove()') })
  it('keeps Lightweight Charts runtime lazy', () => expect(chart).toContain("import('lightweight-charts')"))
  it('uses 44px touch controls', () => expect(toolbar).toContain('min-h-11'))
  it('adds the mobile safe area', () => expect(page).toContain('env(safe-area-inset-bottom)'))
  it('reports aligned dates', () => expect(buildDateConsistency([{ id: 'quote', label: 'Quote', tradeDate: '2026-07-16' }, { id: 'history', label: 'History', tradeDate: '2026-07-16' }]).status).toBe('aligned'))
  it('reports mixed dates', () => expect(buildDateConsistency([{ id: 'quote', label: 'Quote', tradeDate: '2026-07-16' }, { id: 'history', label: 'History', tradeDate: '2026-07-15' }]).mismatched).toBe(true))
  it('reports missing dates', () => expect(buildDateConsistency([{ id: 'quote', label: 'Quote', tradeDate: null }]).status).toBe('missing'))
  it('classifies a high-volume-percent buy', () => expect(classifyInstitutionalFlow(2.1, 50)).toBe('明顯買超'))
  it('classifies a high-percentile sell', () => expect(classifyInstitutionalFlow(-.2, 95)).toBe('明顯賣超'))
  it('does not call fixed-share institutional thresholds', () => expect(read('src/components/stock/InstitutionalAnalysis.tsx')).toContain('netVolumePercent'))
  it('keeps base and basename unchanged', () => { expect(read('vite.config.ts')).toContain("base: '/guli/'"); expect(read('src/main.tsx')).toContain('basename="/guli"') })
})
