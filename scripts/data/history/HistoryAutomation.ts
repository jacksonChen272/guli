import type { HistoryCoverageCounts, HistoryFailureCategory, HistoryManifestItem, HistoryProgress } from './types.ts'

export const HISTORY_BATCH_LIMIT = 100
export const HISTORY_MAX_PAYLOAD_DELTA_BYTES = 20 * 1024 * 1024
export const HISTORY_MAX_STOCK_FILE_BYTES = 2 * 1024 * 1024

export interface HistoryProgressMetrics extends HistoryCoverageCounts {
  completionPercent: number
  analyzablePercent: number
  remainingBatches: number
  estimatedCompletionDays: number
}

export interface HistoryPayloadMetrics {
  batchDeltaBytes: number
  totalHistoryBytes: number
  technicalIndexBytes: number
  gitWorkingTreeDeltaBytes: number
  largestStockFileBytes: number
  averageStockFileBytes: number
  largestStockSymbol: string | null
}

export function selectPendingHistoryBatch(items: HistoryManifestItem[], limit = HISTORY_BATCH_LIMIT, excludedSymbols: Iterable<string> = []) {
  const excluded = new Set(excludedSymbols)
  return items
    .filter((item) => item.status === 'pending' && item.eligibleForTechnical && item.securityType === 'common_stock' && !excluded.has(item.symbol))
    .sort((left, right) => left.symbol.localeCompare(right.symbol))
    .slice(0, Math.max(0, limit))
}

export function resolvePlannedSymbols(previous: HistoryProgress | null, phase: string, candidates: string[]) {
  return previous?.phase === phase && previous.status !== 'completed' && previous.plannedSymbols?.length
    ? [...previous.plannedSymbols]
    : [...candidates]
}

export function calculateHistoryProgress(coverage: HistoryCoverageCounts, batchLimit = HISTORY_BATCH_LIMIT): HistoryProgressMetrics {
  const denominator = coverage.eligibleCommonStocks
  const percentage = (value: number) => denominator > 0 ? Math.round(value / denominator * 1_000) / 10 : 0
  const remainingBatches = coverage.pending > 0 ? Math.ceil(coverage.pending / batchLimit) : 0
  return {
    ...coverage,
    completionPercent: percentage(coverage.complete),
    analyzablePercent: percentage(coverage.technicalDataReady),
    remainingBatches,
    estimatedCompletionDays: remainingBatches,
  }
}

export function validateHistoryCoverage(coverage: HistoryCoverageCounts) {
  const errors: string[] = []
  if (coverage.complete + coverage.partial + coverage.pending + coverage.failed !== coverage.eligibleCommonStocks) {
    errors.push('complete + partial + pending + failed must equal eligibleCommonStocks')
  }
  if (coverage.totalSecurities !== coverage.eligibleCommonStocks + coverage.unsupportedSecurities) {
    errors.push('totalSecurities must equal eligibleCommonStocks + unsupportedSecurities')
  }
  if (coverage.technicalDataReady > coverage.complete + coverage.partial) {
    errors.push('technicalDataReady cannot exceed complete + partial')
  }
  for (const [key, value] of Object.entries(coverage)) {
    if (!Number.isInteger(value) || value < 0) errors.push(`${key} must be a non-negative integer`)
  }
  return { valid: errors.length === 0, errors }
}

export function evaluateHistoryPayload(metrics: HistoryPayloadMetrics) {
  const warnings = metrics.largestStockFileBytes > HISTORY_MAX_STOCK_FILE_BYTES && metrics.largestStockSymbol
    ? [`${metrics.largestStockSymbol}.json exceeds the 2 MiB per-stock warning threshold`]
    : []
  const allowPullRequest = metrics.batchDeltaBytes <= HISTORY_MAX_PAYLOAD_DELTA_BYTES
  return {
    allowPullRequest,
    warnings,
    errors: allowPullRequest ? [] : ['Batch history payload exceeds 20 MiB; pull request creation is blocked'],
  }
}

export function canStartHistoryBackfill(openPullRequestCount: number) {
  return openPullRequestCount === 0
    ? { allowed: true, reason: null }
    : { allowed: false, reason: 'An open automation/history-backfill pull request already exists; this run must stop.' }
}

export interface HistoryPullRequestInput {
  planned: number
  success: number
  complete: number
  partial: number
  failed: number
  newRecords: number
  totalRetries: number
  durationSeconds: number
  coverageBefore: HistoryCoverageCounts
  coverageAfter: HistoryCoverageCounts
  payload: HistoryPayloadMetrics
  auditPassed: number
  auditTotal: number
  tests: string
  build: string
  audit: string
  failedSymbols: string[]
  partialDetails: Array<{ symbol: string; reason: string }>
}

export function buildHistoryPullRequestBody(input: HistoryPullRequestInput) {
  const errorTypes: HistoryFailureCategory[] = ['RATE_LIMIT', 'NETWORK_ERROR', 'INVALID_RESPONSE', 'NO_DATA', 'PARSE_ERROR', 'VALIDATION_ERROR', 'WRITE_ERROR', 'UNKNOWN']
  return [
    '## TWSE History Backfill',
    '',
    `- Planned: ${input.planned}`,
    `- Success: ${input.success}`,
    `- Complete: ${input.complete}`,
    `- Partial: ${input.partial}`,
    `- Failed: ${input.failed}`,
    `- New records: ${input.newRecords.toLocaleString('en-US')}`,
    `- Retries: ${input.totalRetries}`,
    `- Duration: ${input.durationSeconds} seconds`,
    `- History coverage: ${input.coverageBefore.complete.toLocaleString('en-US')}/${input.coverageBefore.eligibleCommonStocks.toLocaleString('en-US')} -> ${input.coverageAfter.complete.toLocaleString('en-US')}/${input.coverageAfter.eligibleCommonStocks.toLocaleString('en-US')}`,
    `- Technical coverage: ${input.coverageBefore.technicalDataReady.toLocaleString('en-US')}/${input.coverageBefore.eligibleCommonStocks.toLocaleString('en-US')} -> ${input.coverageAfter.technicalDataReady.toLocaleString('en-US')}/${input.coverageAfter.eligibleCommonStocks.toLocaleString('en-US')}`,
    `- Pending: ${input.coverageBefore.pending} -> ${input.coverageAfter.pending}`,
    `- Batch payload delta: ${input.payload.batchDeltaBytes.toLocaleString('en-US')} bytes`,
    `- Audit sample: ${input.auditPassed}/${input.auditTotal}`,
    `- Tests: ${input.tests}`,
    `- Build: ${input.build}`,
    `- npm audit: ${input.audit}`,
    '',
    '### Failed symbols',
    input.failedSymbols.length ? input.failedSymbols.map((symbol) => `- ${symbol}`).join('\n') : '- None',
    '',
    '### Partial symbols',
    input.partialDetails.length ? input.partialDetails.map((item) => `- ${item.symbol}: ${item.reason}`).join('\n') : '- None',
    '',
    `Failure categories tracked: ${errorTypes.join(', ')}`,
  ].join('\n')
}
