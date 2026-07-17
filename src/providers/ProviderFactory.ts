import { FutureFinMindProvider } from './FutureFinMindProvider'
import { TWSEProvider } from './TWSEProvider'
import { FutureYahooProvider } from './FutureYahooProvider'
import { MockProvider } from './MockProvider'
import type { GuliDataProvider, ProviderDescriptor, ProviderId } from './ProviderTypes'

export const PROVIDER_PREFERENCE_VERSION = '0.9.0-rc.1'
export const PROVIDER_PREFERENCE_KEY = 'guli-provider-selection'

const LEGACY_PROVIDER_KEYS = [
  'guli-data-provider',
  'guli-provider',
  'guli-provider-source',
  'guli-active-provider',
] as const

export interface ProviderPreferenceStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface ProviderSelectionState {
  id: ProviderId
  origin: 'default' | 'stored' | 'legacy-migrated'
  isExplicitMock: boolean
  migrationNotice: string | null
}

interface StoredProviderPreference {
  version: string
  id: ProviderId
}

const isProviderId = (value: unknown): value is ProviderId =>
  value === 'mock' || value === 'twse' || value === 'finmind' || value === 'yahoo'

const parsePreference = (raw: string): { id: ProviderId; version?: string } | null => {
  if (isProviderId(raw)) return { id: raw }
  try {
    const value = JSON.parse(raw) as unknown
    if (!value || typeof value !== 'object') return null
    const record = value as Record<string, unknown>
    const id = record.id ?? record.provider ?? record.source
    return isProviderId(id)
      ? { id, version: typeof record.version === 'string' ? record.version : undefined }
      : null
  } catch {
    return null
  }
}

const getBrowserStorage = (): ProviderPreferenceStorage | undefined => {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export class ProviderFactory {
  private readonly providers = new Map<ProviderId, GuliDataProvider>([
    ['mock', new MockProvider()],
    ['twse', new TWSEProvider()],
    ['finmind', new FutureFinMindProvider()],
    ['yahoo', new FutureYahooProvider()],
  ])

  private activeId: ProviderId = 'twse'
  private selectionState: ProviderSelectionState = {
    id: 'twse',
    origin: 'default',
    isExplicitMock: false,
    migrationNotice: null,
  }

  constructor(private readonly storage: ProviderPreferenceStorage | undefined = getBrowserStorage()) {
    this.restorePreference()
  }

  create(id: ProviderId): GuliDataProvider {
    const provider = this.providers.get(id)
    if (!provider) throw new Error(`找不到資料 Provider：${id}`)
    return provider
  }

  getActive() { return this.create(this.activeId) }
  getActiveId() { return this.activeId }
  getSelectionState(): ProviderSelectionState { return { ...this.selectionState } }

  select(id: ProviderId) {
    const provider = this.create(id)
    if (!provider.descriptor.enabled) return false
    this.activeId = id
    this.selectionState = {
      id,
      origin: 'stored',
      isExplicitMock: id === 'mock',
      migrationNotice: null,
    }
    this.persistPreference(id)
    return true
  }

  list(): ProviderDescriptor[] {
    return [...this.providers.values()].map((provider) => provider.descriptor)
  }

  private restorePreference() {
    if (!this.storage) return

    const current = this.readPreference(PROVIDER_PREFERENCE_KEY)
    if (current?.version === PROVIDER_PREFERENCE_VERSION && this.isEnabled(current.id)) {
      this.activeId = current.id
      this.selectionState = {
        id: current.id,
        origin: 'stored',
        isExplicitMock: current.id === 'mock',
        migrationNotice: null,
      }
      return
    }

    const legacy = current ?? LEGACY_PROVIDER_KEYS
      .map((key) => this.readPreference(key))
      .find((preference): preference is { id: ProviderId; version?: string } => Boolean(preference))

    if (legacy) {
      const migratedFromMock = legacy.id === 'mock'
      const nextId: ProviderId = migratedFromMock || !this.isEnabled(legacy.id) ? 'twse' : legacy.id
      this.activeId = nextId
      this.selectionState = {
        id: nextId,
        origin: 'legacy-migrated',
        isExplicitMock: false,
        migrationNotice: migratedFromMock
          ? '偵測到舊版 Mock 資料來源設定，已自動遷移至 TWSE 官方資料。'
          : '資料來源設定已更新為 GULI v0.9.0-rc.1 格式。',
      }
      this.persistPreference(nextId)
    }

    for (const key of LEGACY_PROVIDER_KEYS) this.safeRemove(key)
  }

  private readPreference(key: string) {
    try {
      const raw = this.storage?.getItem(key)
      return raw ? parsePreference(raw) : null
    } catch {
      return null
    }
  }

  private isEnabled(id: ProviderId) {
    return this.create(id).descriptor.enabled
  }

  private persistPreference(id: ProviderId) {
    const preference: StoredProviderPreference = { version: PROVIDER_PREFERENCE_VERSION, id }
    try {
      this.storage?.setItem(PROVIDER_PREFERENCE_KEY, JSON.stringify(preference))
    } catch {
      // Storage is optional. The in-memory selection remains valid for this session.
    }
  }

  private safeRemove(key: string) {
    try {
      this.storage?.removeItem(key)
    } catch {
      // Ignore unavailable storage; provider selection still works in memory.
    }
  }
}

export const providerFactory = new ProviderFactory()
