export type Sleep = (milliseconds: number) => Promise<void>

export const defaultSleep: Sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export class HistoryRateLimiter {
  private lastRequestAt = 0
  private readonly requestDelayMs: number
  private readonly batchDelayMs: number
  private readonly sleep: Sleep

  constructor(
    requestDelayMs = 1_200,
    batchDelayMs = 7_000,
    sleep: Sleep = defaultSleep,
  ) { this.requestDelayMs = requestDelayMs; this.batchDelayMs = batchDelayMs; this.sleep = sleep }

  async beforeRequest() {
    const remaining = this.requestDelayMs - (Date.now() - this.lastRequestAt)
    if (remaining > 0) await this.sleep(remaining)
    this.lastRequestAt = Date.now()
  }

  afterRequest() { this.lastRequestAt = Date.now() }
  async betweenBatches() { if (this.batchDelayMs > 0) await this.sleep(this.batchDelayMs) }
}
