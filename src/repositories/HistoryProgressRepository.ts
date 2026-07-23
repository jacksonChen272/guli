import type { TWSEStockHistoryProvider } from '../providers/TWSEStockHistoryProvider'
import type { HistoryProgressSummary } from '../types/officialStockHistory'

export class HistoryProgressRepository {
  private pending: Promise<HistoryProgressSummary> | null = null

  constructor(private readonly provider: TWSEStockHistoryProvider) {}

  get(force = false) {
    if (force) this.clear()
    if (!this.pending) this.pending = this.provider.getProgressSummary().catch((error) => {
      this.pending = null
      throw error
    })
    return this.pending
  }

  clear() {
    this.pending = null
    this.provider.clearCache()
  }
}
