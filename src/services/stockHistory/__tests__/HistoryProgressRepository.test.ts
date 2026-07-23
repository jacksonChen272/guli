import { describe, expect, it, vi } from 'vitest'
import type { TWSEStockHistoryProvider } from '../../../providers/TWSEStockHistoryProvider'
import { HistoryProgressRepository } from '../../../repositories/HistoryProgressRepository'
import type { HistoryProgressSummary } from '../../../types/officialStockHistory'

const summary = { version: 'history-progress-summary-v1', schemaVersion: 'history-progress-summary-v1' } as HistoryProgressSummary

describe('HistoryProgressRepository', () => {
  it('deduplicates reads until the repository is cleared', async () => {
    const getProgressSummary = vi.fn().mockResolvedValue(summary)
    const clearCache = vi.fn()
    const provider = { getProgressSummary, clearCache } as unknown as TWSEStockHistoryProvider
    const repository = new HistoryProgressRepository(provider)
    await Promise.all([repository.get(), repository.get()])
    expect(getProgressSummary).toHaveBeenCalledTimes(1)
    repository.clear()
    await repository.get()
    expect(getProgressSummary).toHaveBeenCalledTimes(2)
    expect(clearCache).toHaveBeenCalledTimes(1)
  })
})
