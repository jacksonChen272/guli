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
  async getStockInstitutionalContext(symbol: string, tradeVolume: number | null = null) {
    try {
      const records = (await this.read(undefined)).data.records
      const record = records.find((item) => item.symbol === symbol) ?? null
      if (!record) return { record: null, netVolumePercent: null, percentile: null }
      const comparable = records.map((item) => Math.abs(item.totalNetShares ?? 0)).sort((left, right) => left - right)
      const magnitude = Math.abs(record.totalNetShares ?? 0)
      const rank = comparable.filter((value) => value <= magnitude).length
      return {
        record,
        netVolumePercent: tradeVolume && record.totalNetShares !== null ? Number((record.totalNetShares / tradeVolume * 100).toFixed(2)) : null,
        percentile: comparable.length ? Math.round(rank / comparable.length * 100) : null,
      }
    } catch { return { record: null, netVolumePercent: null, percentile: null } }
  }
  async getTopNetBuy(type: InstitutionalInvestorType, limit = 10) { try { return rankInstitutionalRecords((await this.read(undefined)).data.records, type, 'buy', limit) } catch { return [] } }
  async getTopNetSell(type: InstitutionalInvestorType, limit = 10) { try { return rankInstitutionalRecords((await this.read(undefined)).data.records, type, 'sell', limit) } catch { return [] } }
  async getDatasetStatus(): Promise<InstitutionalDatasetStatus> { return this.provider.getStatus() }
  async refresh() { this.provider.clearCache(); this.invalidate(); return this.read(undefined, { forceRefresh: true }) }
}
