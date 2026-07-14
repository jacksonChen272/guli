import type { DataResult, InstitutionalTradeRecord, ProviderEventResult, ProviderIndustryResult, ProviderMarketOverview, ProviderStockResult } from '../types/api'
import type { Stock } from '../types/stock'
import type { GuliDataProvider, ProviderDescriptor } from './ProviderTypes'
import { ProviderUnavailableError } from './ProviderTypes'

export abstract class FutureProviderBase implements GuliDataProvider {
  abstract readonly descriptor: ProviderDescriptor
  protected unavailable<T>(): Promise<T> { return Promise.reject(new ProviderUnavailableError(this.descriptor.name)) }
  getMarketOverview(): Promise<DataResult<ProviderMarketOverview>> { return this.unavailable() }
  getStocks(): Promise<ProviderStockResult> { return this.unavailable() }
  getStockDetail(_symbol: string): Promise<DataResult<Stock | null>> { return this.unavailable() }
  getInstitutionalTrades(_date: string): Promise<DataResult<InstitutionalTradeRecord[]>> { return this.unavailable() }
  getIndustryData(): Promise<ProviderIndustryResult> { return this.unavailable() }
  getMarketEvents(): Promise<ProviderEventResult> { return this.unavailable() }
  getLastUpdatedAt(): Promise<string> { return this.unavailable() }
}
