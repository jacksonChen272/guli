import type { MarketDataProvider } from '../services/dataProvider'

export type ProviderId = 'mock' | 'twse' | 'finmind' | 'yahoo'
export interface ProviderDescriptor { id: ProviderId; name: string; description: string; enabled: boolean; isMock: boolean }
export interface GuliDataProvider extends MarketDataProvider { readonly descriptor: ProviderDescriptor }
export class ProviderUnavailableError extends Error { constructor(provider: string) { super(`${provider} 尚未啟用`); this.name = 'ProviderUnavailableError' } }
export class ProviderDataError extends Error {
  constructor(public readonly code: string, message: string, public readonly details?: unknown) { super(message); this.name = 'ProviderDataError' }
}
