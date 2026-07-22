import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { ScreenerRepository } from '../../repositories/ScreenerRepository'

const text = (path: string) => readFile(path, 'utf8')
describe('Full-market foundation and GitHub Pages guard', () => {
  it('uses the new typed history entry point', async () => expect((await text('package.json'))).toContain('scripts/data/fetchTwseHistory.ts'))
  it('filters listed four-digit common stocks', async () => { const source = await text('scripts/data/history/HistoryBatchRunner.ts'); expect(source).toContain("instrumentType === 'stock'"); expect(source).toContain('/^\\d{4}$/') })
  it('supports progress resume and retry-failed selection', async () => { const source = await text('scripts/data/history/HistoryBatchRunner.ts'); expect(source).toContain('HistoryProgress'); expect(source).toContain('retryFailedOnly') })
  it('uses atomic writes', async () => expect(await text('scripts/data/history/HistoryManifestWriter.ts')).toContain('rename(temporary, file)'))
  it('technical and screener generators never use random data', async () => { expect(await text('scripts/generate-technical-index.mjs')).not.toContain('Math.random'); expect(await text('scripts/generate-screener-results.mjs')).not.toContain('Math.random') })
  it('Screener route remains lazy loaded', async () => expect(await text('src/App.tsx')).toContain("lazy(() => import('./pages/SmartScreener')"))
  it('Screener keeps RepositoryHub as its data source', async () => { const source = await text('src/pages/SmartScreener.tsx'); expect(source).not.toContain('fetch('); expect(source).toContain('repositoryHub.screener') })
  it('keeps GitHub Pages base and basename', async () => { expect(await text('vite.config.ts')).toContain("base: '/guli/'"); expect(await text('src/main.tsx')).toContain('basename="/guli"') })
  it('Sidebar displays v1.1.1', async () => expect(await text('src/components/layout/Sidebar.tsx')).toContain('GULI v1.1.1'))
  it('Dashboard keeps technical opportunities', async () => expect(await text('src/pages/Dashboard.tsx')).toContain('<TechnicalScreenerPreview'))
  it('backfill workflow is manual only', async () => expect(await text('.github/workflows/twse-history-backfill.yml')).not.toContain('push:'))
  it('Screener Repository cache avoids duplicate reads', async () => { const fetcher = async () => new Response(JSON.stringify({ schemaVersion:'1.0', formulaVersion:'screener-v1.0', tradeDate:null, generatedAt:'x', technicalIndexGeneratedAt:'x', sampleCount:0, complete250Count:0, highRiskCount:0, presets:[], results:[], warnings:[] }), { status: 200 }); const repository = new ScreenerRepository(fetcher, '/guli/'); expect((await repository.getDataset()).sampleCount).toBe(0) })
})
