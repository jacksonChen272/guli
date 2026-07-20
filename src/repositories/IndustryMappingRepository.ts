import { TWSEIndustryMappingProvider } from '../providers/TWSEIndustryMappingProvider'
import { calculateIndustryMappingCoverage } from '../services/industryMapping/IndustryMappingCoverageService'

export class IndustryMappingRepository {
  constructor(private readonly provider = new TWSEIndustryMappingProvider()) {}
  getLatest(force = false) { return this.provider.getLatest(force) }
  async getBySymbol(symbol: string) { return (await this.getLatest()).stocks.find((stock) => stock.symbol === symbol) ?? null }
  async getStocksByIndustry(industryCode: string) { return (await this.getLatest()).stocks.filter((stock) => stock.industryCode === industryCode) }
  async getIndustries() { return (await this.getLatest()).industries }
  async getCoverage() { return calculateIndustryMappingCoverage(await this.getLatest()) }
  getStatus() { return this.provider.getStatus() }
  refresh() { return this.provider.refresh() }
  clearCache() { this.provider.clearCache() }
}
