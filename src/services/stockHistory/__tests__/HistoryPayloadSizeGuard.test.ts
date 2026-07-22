import { describe, expect, it } from 'vitest'
import { evaluateHistoryPayload } from '../../../../scripts/data/history/HistoryAutomation.ts'

const metrics = { batchDeltaBytes: 1024, totalHistoryBytes: 2048, technicalIndexBytes: 512, gitWorkingTreeDeltaBytes: 1024, largestStockFileBytes: 800, averageStockFileBytes: 700, largestStockSymbol: '2330' }

describe('history payload capacity guard', () => {
  it('allows a batch at or below 20 MiB', () => expect(evaluateHistoryPayload({ ...metrics, batchDeltaBytes: 20 * 1024 * 1024 }).allowPullRequest).toBe(true))
  it('blocks a pull request over 20 MiB', () => expect(evaluateHistoryPayload({ ...metrics, batchDeltaBytes: 20 * 1024 * 1024 + 1 }).allowPullRequest).toBe(false))
  it('warns without blocking when one stock file exceeds 2 MiB', () => {
    const result = evaluateHistoryPayload({ ...metrics, largestStockFileBytes: 2 * 1024 * 1024 + 1 })
    expect(result.allowPullRequest).toBe(true)
    expect(result.warnings[0]).toContain('2330.json')
  })
})
