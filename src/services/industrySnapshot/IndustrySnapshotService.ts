import type { IndustrySnapshotRepository } from '../../repositories/IndustrySnapshotRepository'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { IndustryMemoryService } from './IndustryMemoryService'
import { IndustrySnapshotDiffService } from './IndustrySnapshotDiffService'
export class IndustrySnapshotService {
  private readonly diff = new IndustrySnapshotDiffService(); private readonly memory = new IndustryMemoryService()
  constructor(private readonly repository: IndustrySnapshotRepository) {}
  getLatest() { return this.repository.getLatest() }
  getByDate(date: string) { return this.repository.getByDate(date) }
  getHistory(days: number) { return this.repository.getHistory(days) }
  getIndustryHistory(industryId: string, days: number) { return this.repository.getIndustryHistory(industryId, days) }
  async getDiff(currentDate: string, previousDate?: string) { const current = await this.getByDate(currentDate); const previous = previousDate ? await this.getByDate(previousDate) : (await this.getHistory(100)).filter((item) => item.tradeDate < currentDate).sort((a, b) => b.tradeDate.localeCompare(a.tradeDate))[0]; return this.diff.compare(current, previous) }
  async getIndustryMemory(days: number) { return this.memory.calculate(await this.getHistory(days), days) }
}
export const industrySnapshotService = new IndustrySnapshotService(repositoryHub.industrySnapshots)
