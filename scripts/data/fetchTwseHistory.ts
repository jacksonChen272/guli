import { HistoryBatchRunner, type HistoryBatchOptions } from './history/HistoryBatchRunner.ts'

function optionValue(argv: string[], name: string) {
  const inline = argv.find((item) => item.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : undefined
}

const positive = (value: string | undefined, fallback: number, minimum = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback
}

export function parseHistoryArgs(argv: string[], root = process.cwd()): HistoryBatchOptions {
  const symbols = [
    ...argv.filter((item) => item.startsWith('--symbol=')).map((item) => item.slice(9)),
    ...(optionValue(argv, '--symbols') ?? '').split(','),
    ...(optionValue(argv, '--symbol') ? [optionValue(argv, '--symbol') as string] : []),
  ].map((item) => item.trim()).filter((item) => /^\d{4}$/.test(item))
  return {
    root,
    batchSize: positive(optionValue(argv, '--batch-size'), 20, 1),
    limit: positive(optionValue(argv, '--limit'), 20, 1),
    executionLimit: optionValue(argv, '--execution-limit') ? positive(optionValue(argv, '--execution-limit'), 20, 1) : null,
    startSymbol: optionValue(argv, '--start-symbol') ?? null,
    symbols: [...new Set(symbols)],
    startMonth: optionValue(argv, '--start-month') ?? null,
    targetDays: positive(optionValue(argv, '--target-days'), 300, 60),
    technicalMinimumDays: positive(optionValue(argv, '--technical-minimum-days'), 120, 60),
    requestDelay: positive(optionValue(argv, '--request-delay') ?? optionValue(argv, '--rate-limit'), 1_200, 350),
    batchDelay: positive(optionValue(argv, '--batch-delay'), 8_000, 0),
    maxRetries: positive(optionValue(argv, '--max-retries') ?? optionValue(argv, '--retries'), 3, 0),
    timeout: positive(optionValue(argv, '--timeout'), 15_000, 5_000),
    forceRefresh: argv.includes('--force-refresh'),
    retryFailedOnly: argv.includes('--retry-failed-only'),
    dryRun: argv.includes('--dry-run'),
    planOnly: argv.includes('--plan-only'),
    incremental: argv.includes('--incremental'),
    phase: optionValue(argv, '--phase') ?? 'manual-backfill',
    partialRefetchReason: optionValue(argv, '--partial-refetch-reason') ?? null,
  }
}

const options = parseHistoryArgs(process.argv.slice(2))
new HistoryBatchRunner(options).run().then((summary) => {
  if (summary.failed > 0) console.warn(`[history] ${summary.failed} 檔已記錄為失敗，批次其餘股票已完成；可使用 --retry-failed-only 重試。`)
}).catch((error: unknown) => {
  console.error(`[history] 批次失敗：${error instanceof Error ? error.stack ?? error.message : String(error)}`)
  process.exitCode = 1
})
