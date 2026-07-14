import type { DataResult, InstitutionalTradeRecord, ProviderEventResult, ProviderIndustryResult, ProviderMarketOverview, ProviderStockResult } from '../types/api'
import type { Stock } from '../types/stock'

export interface MarketDataProvider {
  getMarketOverview(): Promise<DataResult<ProviderMarketOverview>>
  getStocks(): Promise<ProviderStockResult>
  getStockDetail(symbol: string): Promise<DataResult<Stock | null>>
  getInstitutionalTrades(date: string): Promise<DataResult<InstitutionalTradeRecord[]>>
  getIndustryData(): Promise<ProviderIndustryResult>
  getMarketEvents(): Promise<ProviderEventResult>
  getLastUpdatedAt(): Promise<string>
}
