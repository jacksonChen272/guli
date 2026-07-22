import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { atomicWriteJson, readJson } from './history/HistoryManifestWriter.ts'
import type { HistoryBatchSummary } from './history/HistoryBatchRunner.ts'
import type { HistoryManifest, HistoryProgress } from './history/types.ts'

const optionValue = (name: string) => process.argv.slice(2).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1)
const root = process.cwd()
const reportPath = path.join(root, 'reports', 'history-backfill-summary.json')
const report = await readJson<HistoryBatchSummary>(reportPath, null as unknown as HistoryBatchSummary)
const manifest = await readJson<HistoryManifest | null>(path.join(root, 'public', 'data', 'history', 'history-manifest.json'), null)
const progress = await readJson<HistoryProgress | null>(path.join(root, 'data', 'history', 'history-progress.json'), null)
if (!report || !manifest) throw new Error('History report or manifest is missing')

const assetsDirectory = path.join(root, 'dist', 'assets')
const assets = await readdir(assetsDirectory).catch(() => [])
const assetSize = async (pattern: RegExp) => {
  const names = assets.filter((name) => pattern.test(name))
  return names.reduce(async (total, name) => await total + (await stat(path.join(assetsDirectory, name))).size, Promise.resolve(0))
}
const initialJsBytes = await assetSize(/^index-.*\.js$/)
const dashboardChunkBytes = await assetSize(/^Dashboard-.*\.js$/)
const buildTimeMs = Number(optionValue('--build-time-ms'))
const partialDetails = report.selectedSymbols.flatMap((symbol) => {
  const item = manifest.items.find((candidate) => candidate.symbol === symbol)
  return item?.status === 'partial'
    ? [{ symbol, recordCount: item.recordCount, targetTradingDays: manifest.targetTradingDays, reason: 'TWSE official history available for fewer than the target trading days' }]
    : []
})

await atomicWriteJson(reportPath, {
  ...report,
  executionSegments: progress?.phaseMetrics?.executionSegments ?? 1,
  gitRepositorySizeDeltaBytes: 0,
  projectedGitPayloadDeltaBytes: report.repositoryPayloadBytesDelta,
  buildTimeMs: Number.isFinite(buildTimeMs) && buildTimeMs >= 0 ? Math.round(buildTimeMs) : 0,
  pagesInitialLoadImpact: {
    estimatedInitialJsDeltaBytes: 0,
    initialJsBytes,
    dashboardChunkBytes,
    explanation: 'History JSON remains a public on-demand resource and is not bundled into the home-page JavaScript.',
  },
  partialDetails,
  notes: [
    'Exactly one locked 100-symbol phase was executed.',
    'No Phase 3 batch was started.',
    'Git repository size delta is zero until the generated data is committed; projected payload delta is reported separately.',
  ],
})
console.log(`[history:finalize] build=${Math.round(buildTimeMs || 0)}ms, initial-js-impact=0 bytes, partial=${partialDetails.length}`)
