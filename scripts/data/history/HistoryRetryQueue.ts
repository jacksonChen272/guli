import type { HistoryFailureCategory } from './types.ts'
import { defaultSleep, type Sleep } from './HistoryRateLimiter.ts'

export class HistoryRequestError extends Error {
  readonly category: HistoryFailureCategory
  readonly retryable: boolean
  constructor(category: HistoryFailureCategory, message: string, retryable = true) {
    super(message)
    this.category = category
    this.retryable = retryable
    this.name = 'HistoryRequestError'
  }
}

export function categorizeHistoryError(error: unknown): HistoryFailureCategory {
  if (error instanceof HistoryRequestError) return error.category
  const message = error instanceof Error ? error.message : String(error)
  if (/429|rate.?limit/i.test(message)) return 'RATE_LIMIT'
  if (/abort|timeout|fetch|network|ECONN/i.test(message)) return 'NETWORK_ERROR'
  if (/JSON|parse/i.test(message)) return 'PARSE_ERROR'
  if (/no data|查無資料|沒有符合/i.test(message)) return 'NO_DATA'
  if (/validation|驗證/i.test(message)) return 'VALIDATION_ERROR'
  return 'UNKNOWN'
}

export class HistoryRetryQueue {
  readonly delaysMs: number[]
  private readonly sleep: Sleep

  constructor(maxRetries = 3, sleep: Sleep = defaultSleep, delaysMs = [5_000, 15_000, 45_000]) {
    this.sleep = sleep
    this.delaysMs = delaysMs.slice(0, Math.max(0, maxRetries))
  }

  async run<T>(operation: (attempt: number) => Promise<T>): Promise<{ value: T; attempts: number }> {
    let lastError: unknown
    for (let attempt = 1; attempt <= this.delaysMs.length + 1; attempt += 1) {
      try { return { value: await operation(attempt), attempts: attempt } }
      catch (error) {
        lastError = error
        if (error instanceof HistoryRequestError && !error.retryable) break
        if (attempt <= this.delaysMs.length) await this.sleep(this.delaysMs[attempt - 1])
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError))
  }
}
