import { describe, expect, it, vi } from 'vitest'
import { HistoryRequestError, HistoryRetryQueue, categorizeHistoryError } from '../../../../scripts/data/history/HistoryRetryQueue.ts'

describe('History Retry Queue', () => {
  it('retries rate limits with the configured schedule', async () => { const sleep = vi.fn(async () => undefined); const queue = new HistoryRetryQueue(3, sleep, [5, 15, 45]); let calls = 0; const result = await queue.run(async () => { calls += 1; if (calls < 3) throw new HistoryRequestError('RATE_LIMIT', '429'); return 'ok' }); expect(result).toEqual({ value: 'ok', attempts: 3 }); expect(sleep).toHaveBeenNthCalledWith(1, 5); expect(sleep).toHaveBeenNthCalledWith(2, 15) })
  it('does not retry NO_DATA', async () => { const queue = new HistoryRetryQueue(3, vi.fn(async () => undefined), [5, 15, 45]); let calls = 0; await expect(queue.run(async () => { calls += 1; throw new HistoryRequestError('NO_DATA', 'no data', false) })).rejects.toThrow('no data'); expect(calls).toBe(1) })
  it('categorizes network errors', () => expect(categorizeHistoryError(new Error('fetch timeout'))).toBe('NETWORK_ERROR'))
})
