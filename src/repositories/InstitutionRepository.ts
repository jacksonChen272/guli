import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { TWSEInstitutionalProvider } from '../providers/TWSEInstitutionalProvider'
import { rankInstitutionalRecords } from '../services/institutionalData/InstitutionalService'
import type { DataResult } from '../types/api'
import type { InstitutionalDatasetStatus, InstitutionalInvestorType, OfficialInstitutionalDataset } from '../types/officialInstitutionalData'
import { BaseRepository } from './BaseRepository'

export class InstitutionRepository extends BaseRepository<OfficialInstitutionalDataset, void> {
  constructor(cache: CacheStore, policy: CachePolicy, private readonly provider = new TWSEInstitutionalProvider()) { super('institutions', 'institutions', cache, policy) }
  protected async fetch(): Promise<DataResult<OfficialInstitutionalDataset>> { const data = await this.provider.getLatestDataset(); return { data, source: 'TWSE Official', updatedAt: data.fetchedAt, status: data.status === 'partial' ? 'stale' : 'success', warnings: data.warnings } }
  async getMarketTotals() { try { return (await this.read(undefined)).data.marketTotals } catch { return null } }
  async getStockInstitutional(symbol: string) { try { return (await this.read(undefined)).data.records.find((record) => record.symbol === symbol) ?? null } catch { return null } }
  async getTopNetBuy(type: InstitutionalInvestorType, limit = 10) { try { return rankInstitutionalRecords((await this.read(undefined)).data.records, type, 'buy', limit) } catch { return [] } }
  async getTopNetSell(type: InstitutionalInvestorType, limit = 10) { try { return rankInstitutionalRecords((await this.read(undefined)).data.records, type, 'sell', limit) } catch { return [] } }
  async getDatasetStatus(): Promise<InstitutionalDatasetStatus> { return this.provider.getStatus() }
  async refresh() { this.provider.clearCache(); this.invalidate(); return this.read(undefined, { forceRefresh: true }) }
}
