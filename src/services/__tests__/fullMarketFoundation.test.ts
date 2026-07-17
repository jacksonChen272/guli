import { readFile } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'
import { ScreenerRepository } from '../../repositories/ScreenerRepository'

const text = (path: string) => readFile(path, 'utf8')
describe('Full-market foundation and GitHub Pages guard', () => {
  it('backfill 從 twse-stocks 清單載入', async () => expect(await text('scripts/fetch-twse-stock-history.mjs')).toContain('twse-stocks'))
  it('backfill 排除非四位數代號', async () => expect(await text('scripts/fetch-twse-stock-history.mjs')).toContain('/^\\d{4}$/'))
  it('backfill 支援 checkpoint', async () => expect(await text('scripts/fetch-twse-stock-history.mjs')).toContain('backfill-progress.json'))
  it('backfill 支援 resume', async () => expect(await text('scripts/fetch-twse-stock-history.mjs')).toContain('--resume'))
  it('backfill 支援 retry failed', async () => expect(await text('scripts/fetch-twse-stock-history.mjs')).toContain('--retry-failed-only'))
  it('backfill 使用原子寫入', async () => expect(await text('scripts/fetch-twse-stock-history.mjs')).toContain('rename(temporary, file)'))
  it('技術索引不使用 Math.random', async () => expect(await text('scripts/generate-technical-index.mjs')).not.toContain('Math.random'))
  it('選股產生器不使用 Math.random', async () => expect(await text('scripts/generate-screener-results.mjs')).not.toContain('Math.random'))
  it('Screener route lazy loading', async () => expect(await text('src/App.tsx')).toContain("lazy(() => import('./pages/SmartScreener')"))
  it('Screener 不逐檔 fetch 歷史 JSON', async () => { const source = await text('src/pages/SmartScreener.tsx'); expect(source).not.toContain('fetch('); expect(source).toContain('repositoryHub.screener') })
  it('K 線只在 Drawer lazy load', async () => expect(await text('src/components/screener/ScreenerQuickDrawer.tsx')).toContain("lazy(() => import('../charts/lightweight/CandlestickPriceChart')"))
  it('GitHub Pages base 保留', async () => expect(await text('vite.config.ts')).toContain("base: '/guli/'"))
  it('BrowserRouter basename 保留', async () => expect(await text('src/main.tsx')).toContain('basename="/guli"'))
  it('Repository 只讀 technical index 與 screener summary', async () => { const fetcher = vi.fn(async () => new Response(JSON.stringify({ schemaVersion:'1.0', formulaVersion:'screener-v1.0', tradeDate:null, generatedAt:'x', technicalIndexGeneratedAt:'x', sampleCount:0, complete250Count:0, highRiskCount:0, presets:[], results:[], warnings:[] }), { status: 200 })); const repository = new ScreenerRepository(fetcher, '/guli/'); await repository.getDataset(); expect(fetcher).toHaveBeenCalledWith('/guli/data/screener/latest.json', expect.any(Object)) })
  it('Repository Cache 避免重複讀取', async () => { const fetcher = vi.fn(async () => new Response(JSON.stringify({ schemaVersion:'1.0', formulaVersion:'screener-v1.0', tradeDate:null, generatedAt:'x', technicalIndexGeneratedAt:'x', sampleCount:0, complete250Count:0, highRiskCount:0, presets:[], results:[], warnings:[] }), { status: 200 })); const repository = new ScreenerRepository(fetcher, '/guli/'); await repository.getDataset(); await repository.getDataset(); expect(fetcher).toHaveBeenCalledTimes(1) })
  it('Sidebar 顯示 v1.0.0-beta.3', async () => expect(await text('src/components/layout/Sidebar.tsx')).toContain('GULI v1.0.0-beta.3'))
  it('Sidebar 使用固定市場工具順序且包含智慧選股', async () => {
    const navigation = await text('src/config/navigation.ts')
    const expectedOrder = [
      "'/'",
      "'/history'",
      "'/industries'",
      "'/capital-flow'",
      "'/market-focus'",
      "'/screener'",
      "'/stock-analysis'",
      "'/swing-strategy'",
      "'/watchlist'",
      "'/stock-snapshots'",
      "'/decisions'",
    ]
    let previous = -1
    for (const path of expectedOrder) {
      const current = navigation.indexOf(path, previous + 1)
      expect(current).toBeGreaterThan(previous)
      previous = current
    }
    expect(await text('src/components/layout/Sidebar.tsx')).toContain('marketNavigationPaths')
  })
  it('Decision v1.0 權重檔未被 Technical Score 取代', async () => { const source = await text('src/config/decisionFormula.ts'); expect(source).toContain('decision-v1.0'); expect(source).not.toContain('technicalScoreWeights') })
  it('Dashboard 掛載技術機會預覽', async () => expect(await text('src/pages/Dashboard.tsx')).toContain('<TechnicalScreenerPreview'))
  it('手機選股使用卡片模式', async () => expect(await text('src/pages/SmartScreener.tsx')).toContain('md:hidden'))
  it('工作流程不在 push 時執行全市場 backfill', async () => expect(await text('.github/workflows/backfill-stock-history.yml')).not.toContain('push:'))
})
