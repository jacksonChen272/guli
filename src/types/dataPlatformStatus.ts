import type { ProviderId } from '../providers/ProviderTypes'

export type MarketPlatformState = 'Official' | 'Mock' | 'Missing'
export type OfficialDatasetPlatformState = 'Official' | 'Partial' | 'Missing'
export type IndustryPlatformState = 'Mock' | 'Derived' | 'Missing'

export interface DataPlatformStatus {
  providerId: ProviderId
  providerLabel: string
  market: MarketPlatformState
  stocks: OfficialDatasetPlatformState
  institutions: OfficialDatasetPlatformState
  industry: IndustryPlatformState
  summary: string
  warnings: string[]
  marketTradeDate: string | null
  stockTradeDate: string | null
  institutionalTradeDate: string | null
  updatedAt: string | null
  cache: string
  allCoreOfficial: boolean
  canSwitchToTwse: boolean
  migrationNotice: string | null
}
