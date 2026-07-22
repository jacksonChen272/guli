import { describe, expect, it } from 'vitest'
import { HistoryBatchRunner, type HistoryBatchOptions } from '../../../../scripts/data/history/HistoryBatchRunner.ts'
import type { HistorySecurity, TwseHistoryDataset } from '../../../../scripts/data/history/types.ts'

const options: HistoryBatchOptions = { root: '.', batchSize: 20, limit: 20, startSymbol: null, symbols: [], startMonth: null, targetDays: 300, technicalMinimumDays: 120, requestDelay: 0, batchDelay: 0, maxRetries: 0, forceRefresh: false, retryFailedOnly: false, dryRun: true, incremental: false, timeout: 5000 }
const empty = new Map<string, TwseHistoryDataset>()
const securities: HistorySecurity[] = [{ symbol: '0050', name: 'ETF', instrumentType: 'etf' }, { symbol: '1101', name: 'A', instrumentType: 'stock' }, { symbol: '1102', name: 'B', instrumentType: 'stock' }]

describe('History Batch Runner', () => {
  it('filters unsupported products and respects the limit', () => { const runner = new HistoryBatchRunner({ ...options, limit: 1 }, { fetchMonth: async () => ({ name: null, points: [], warnings: [] }) }); expect(runner.selectSymbols(securities, empty, null).map((item) => item.symbol)).toEqual(['1101']) })
  it('can retry only checkpoint failures', () => { const runner = new HistoryBatchRunner({ ...options, retryFailedOnly: true }, { fetchMonth: async () => ({ name: null, points: [], warnings: [] }) }); const selected = runner.selectSymbols(securities, empty, { version: 'history-progress-v1', startedAt: '', updatedAt: '', totalSymbols: 2, completedSymbols: [], failedSymbols: [{ symbol: '1102', category: 'NETWORK_ERROR', message: 'x', attempts: 1, occurredAt: '' }], pendingSymbols: ['1101'], lastProcessedSymbol: null, status: 'partial' }); expect(selected.map((item) => item.symbol)).toEqual(['1102']) })
  it('supports selecting one explicit symbol', () => { const runner = new HistoryBatchRunner({ ...options, symbols: ['1102'] }, { fetchMonth: async () => ({ name: null, points: [], warnings: [] }) }); expect(runner.selectSymbols(securities, empty, null).map((item) => item.symbol)).toEqual(['1102']) })
  it('daily incremental mode does not create short histories for pending symbols', () => { const runner = new HistoryBatchRunner({ ...options, incremental: true }, { fetchMonth: async () => ({ name: null, points: [], warnings: [] }) }); expect(runner.selectSymbols(securities, empty, null)).toEqual([]) })
})
