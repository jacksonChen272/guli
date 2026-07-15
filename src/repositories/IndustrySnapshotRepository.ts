import { CachePolicy } from '../cache/CachePolicy'
import { IndustrySnapshotStorage } from '../services/industrySnapshot/IndustrySnapshotStorage'
export class IndustrySnapshotRepository {
  constructor(private readonly storage = new IndustrySnapshotStorage(undefined, import.meta.env.BASE_URL, new CachePolicy().getTtl('industry-snapshots'))) {}
  getLatest() { return this.storage.getLatest() }
  getByDate(date: string) { return this.storage.getByDate(date) }
  getHistory(days: number) { return this.storage.getHistory(days) }
  async getIndustryHistory(industryId: string, days: number) { const history = await this.getHistory(days); return history.map((snapshot) => ({ tradeDate: snapshot.tradeDate, item: snapshot.industries.find((item) => item.industryId === industryId) })).filter((entry): entry is { tradeDate: string; item: NonNullable<typeof entry.item> } => Boolean(entry.item)) }
  clearCache() { this.storage.clearCache() }
}
