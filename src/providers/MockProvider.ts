import { MockDataProvider, mockDataSnapshot } from '../services/mockDataProvider'
import type { GuliDataProvider, ProviderDescriptor } from './ProviderTypes'

export class MockProvider extends MockDataProvider implements GuliDataProvider {
  readonly descriptor: ProviderDescriptor = { id: 'mock', name: 'GULI Mock Data', description: '集中式模擬市場資料，供開發、測試與展示使用。', enabled: true, isMock: true }
  getSnapshot() { return mockDataSnapshot }
}
