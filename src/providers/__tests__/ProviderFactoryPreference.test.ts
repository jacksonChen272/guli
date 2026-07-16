import { describe, expect, it } from 'vitest'
import {
  PROVIDER_PREFERENCE_KEY,
  PROVIDER_PREFERENCE_VERSION,
  ProviderFactory,
  type ProviderPreferenceStorage,
} from '../ProviderFactory'

class TestStorage implements ProviderPreferenceStorage {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

describe('ProviderFactory v0.8 provider preference migration', () => {
  it('沒有設定時預設使用 TWSE', () => {
    const factory = new ProviderFactory(new TestStorage())
    expect(factory.getActiveId()).toBe('twse')
    expect(factory.getSelectionState().origin).toBe('default')
  })

  it('舊版 current key 的 Mock 設定會自動遷移至 TWSE', () => {
    const storage = new TestStorage()
    storage.setItem(PROVIDER_PREFERENCE_KEY, JSON.stringify({ version: '0.7.2', id: 'mock' }))
    const factory = new ProviderFactory(storage)
    expect(factory.getActiveId()).toBe('twse')
    expect(factory.getSelectionState()).toMatchObject({ origin: 'legacy-migrated', isExplicitMock: false })
    expect(factory.getSelectionState().migrationNotice).toContain('已自動遷移至 TWSE')
  })

  it('舊版 legacy key 的 Mock 設定會移除並遷移', () => {
    const storage = new TestStorage()
    storage.setItem('guli-data-provider', 'mock')
    const factory = new ProviderFactory(storage)
    expect(factory.getActiveId()).toBe('twse')
    expect(storage.getItem('guli-data-provider')).toBeNull()
    expect(JSON.parse(storage.getItem(PROVIDER_PREFERENCE_KEY) ?? '{}')).toEqual({
      version: PROVIDER_PREFERENCE_VERSION,
      id: 'twse',
    })
  })

  it('本版本明確選擇 Mock 時會保留並標記供 UI 提示', () => {
    const storage = new TestStorage()
    storage.setItem(PROVIDER_PREFERENCE_KEY, JSON.stringify({
      version: PROVIDER_PREFERENCE_VERSION,
      id: 'mock',
    }))
    const factory = new ProviderFactory(storage)
    expect(factory.getActiveId()).toBe('mock')
    expect(factory.getSelectionState()).toMatchObject({ origin: 'stored', isExplicitMock: true })
  })

  it('手動切換資料來源會使用目前版本格式持久化', () => {
    const storage = new TestStorage()
    const factory = new ProviderFactory(storage)
    expect(factory.select('mock')).toBe(true)
    expect(JSON.parse(storage.getItem(PROVIDER_PREFERENCE_KEY) ?? '{}')).toEqual({
      version: PROVIDER_PREFERENCE_VERSION,
      id: 'mock',
    })
  })

  it('未啟用的 Provider 不會取代 TWSE', () => {
    const factory = new ProviderFactory(new TestStorage())
    expect(factory.select('finmind')).toBe(false)
    expect(factory.getActiveId()).toBe('twse')
  })
})
