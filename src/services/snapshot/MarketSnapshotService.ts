import type { SnapshotRepository } from '../../repositories/SnapshotRepository'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { MarketMemoryService } from './MarketMemoryService'
import { SnapshotDiffService } from './SnapshotDiffService'
export class MarketSnapshotService {
  private readonly diff = new SnapshotDiffService(); private readonly memory = new MarketMemoryService()
  constructor(private readonly repository: SnapshotRepository) {}
  getLatestSnapshot() { return this.repository.getLatest() }
  getSnapshot(date: string) { return this.repository.getByDate(date) }
  getHistory(days: number) { return this.repository.getHistory(days) }
  async getDiff(currentDate: string, previousDate?: string) { const current = await this.getSnapshot(currentDate); if (previousDate) return this.diff.compare(current, await this.getSnapshot(previousDate)); const history = await this.getHistory(100); const previous = history.filter((item) => item.tradeDate < currentDate).sort((a, b) => b.tradeDate.localeCompare(a.tradeDate))[0]; return this.diff.compare(current, previous) }
  async getMarketMemory(days: number) { return this.memory.calculate(await this.getHistory(days), days) }
}
export const marketSnapshotService = new MarketSnapshotService(repositoryHub.snapshots)
