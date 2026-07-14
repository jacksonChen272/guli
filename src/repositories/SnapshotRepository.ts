import { CachePolicy } from '../cache/CachePolicy'
import { SnapshotStorage } from '../services/snapshot/SnapshotStorage'
export class SnapshotRepository {
  constructor(private readonly storage = new SnapshotStorage(undefined, import.meta.env.BASE_URL, new CachePolicy().getTtl('snapshots'))) {}
  getLatest() { return this.storage.getLatest() }
  getByDate(date: string) { return this.storage.getByDate(date) }
  getHistory(days: number) { return this.storage.getHistory(days) }
  async getAvailableDates() { return (await this.storage.getIndex()).snapshots.map((item) => item.tradeDate) }
  clearCache() { this.storage.clearCache() }
}
