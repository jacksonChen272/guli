import { FutureFinMindProvider } from './FutureFinMindProvider'
import { TWSEProvider } from './TWSEProvider'
import { FutureYahooProvider } from './FutureYahooProvider'
import { MockProvider } from './MockProvider'
import type { GuliDataProvider, ProviderDescriptor, ProviderId } from './ProviderTypes'

export class ProviderFactory {
  private readonly providers = new Map<ProviderId, GuliDataProvider>([['mock', new MockProvider()], ['twse', new TWSEProvider()], ['finmind', new FutureFinMindProvider()], ['yahoo', new FutureYahooProvider()]])
  private activeId: ProviderId = 'twse'
  create(id: ProviderId): GuliDataProvider { const provider = this.providers.get(id); if (!provider) throw new Error(`未知資料來源：${id}`); return provider }
  getActive() { return this.create(this.activeId) }
  getActiveId() { return this.activeId }
  select(id: ProviderId) { const provider = this.create(id); if (!provider.descriptor.enabled) return false; this.activeId = id; return true }
  list(): ProviderDescriptor[] { return [...this.providers.values()].map((provider) => provider.descriptor) }
}

export const providerFactory = new ProviderFactory()
