import { describe, expect, it, vi } from 'vitest'
import type { OfficialIndustryMappingDataset } from '../../types/officialIndustryMapping'
import type { OfficialStockDailyRecord } from '../../types/officialStockData'
import { RecentSearchRepository, type RecentSearchStorage } from '../RecentSearchRepository'
import { SearchRepository } from '../SearchRepository'
import { StockDataStatusRepository } from '../StockDataStatusRepository'

class MemoryStorage implements RecentSearchStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

const quote = (symbol: string, name: string, tradeValue = 1_000_000): OfficialStockDailyRecord => ({
  symbol, name, tradeDate: '2026-07-20', market: 'TWSE', instrumentType: 'stock', tradeVolume: 100_000,
  transactionCount: 100, tradeValue, open: 100, high: 103, low: 99, close: 102, changeDirection: 'up', change: 2,
  bidPrice: null, bidVolume: null, askPrice: null, askVolume: null, peRatio: null, source: 'TWSE', fetchedAt: '2026-07-20T08:00:00Z', status: 'official', warnings: [],
})

const mapping: OfficialIndustryMappingDataset = {
  schemaVersion: '1.0', market: 'TWSE', source: 'TWSE', sourceUrl: 'https://example.test', fetchedAt: '2026-07-20T08:00:00Z', effectiveDate: '2026-07-20', totalRecords: 5, stockRecords: 5, excludedRecords: 0, mappedStockCount: 5, unmappedStockCount: 0, status: 'official', warnings: [],
  industries: [{ industryCode: '24', industryName: '半導體業', stockCount: 5, source: 'TWSE', status: 'official' }],
  stocks: ['2330', '2324', '2317', '2303', '2454'].map((symbol) => ({ symbol, name: symbol, market: 'TWSE' as const, instrumentType: 'stock' as const, industryCode: '24', industryName: '半導體業', source: 'TWSE' as const, status: 'official' as const, updatedAt: '2026-07-20T08:00:00Z' })),
}

function createRepository() {
  const getStocks = vi.fn(async () => [quote('2330', '台積電', 9_000_000), quote('2324', '仁寶'), quote('2317', '鴻海'), quote('2303', '聯電'), quote('2454', '聯發科')])
  const status = new StockDataStatusRepository({
    getStocks,
    getIndustryMapping: async () => mapping,
    getHistorySymbols: async () => ['2330'],
    getTechnicalIndex: async () => { throw new Error('not covered') },
    getScreener: async () => { throw new Error('not covered') },
    getSnapshotIndex: async () => { throw new Error('not covered') },
    getDecisionSummary: async () => ({ tradeDate: '2026-07-20', generatedAt: '2026-07-20T09:00:00Z', stockCount: 5 }),
    getDecision: async () => { throw new Error('not loaded') },
    getSnapshot: async () => { throw new Error('not loaded') },
    getMockStocks: () => [],
  })
  return { repository: new SearchRepository(status, new RecentSearchRepository(new MemoryStorage())), getStocks }
}

describe('SearchRepository', () => {
  it('啟動後只建立一次全市場索引', async () => { const { repository, getStocks } = createRepository(); await repository.initialize(); await repository.search('23'); await repository.search('台積'); expect(getStocks).toHaveBeenCalledTimes(1) })
  it('代碼前綴結果依產品指定順序排列', async () => { const { repository } = createRepository(); expect((await repository.search('23', 4)).map((result) => result.item.kind === 'stock' ? result.item.symbol : '')).toEqual(['2330', '2324', '2317', '2303']) })
  it('完全符合代碼優先於其他結果', async () => { const { repository } = createRepository(); const result = await repository.search('2330'); expect(result[0].item.kind).toBe('stock'); expect(result[0].priority).toBe(1) })
  it('可搜尋股票名稱', async () => { const { repository } = createRepository(); const result = await repository.search('台積'); expect(result[0].item.kind === 'stock' && result[0].item.symbol).toBe('2330') })
  it('可搜尋全站功能命令', async () => { const { repository } = createRepository(); const result = await repository.search('Dashboard'); expect(result[0].item.kind === 'command' && result[0].item.path).toBe('/') })
  it('最近搜尋透過 SearchRepository 去重並置頂', () => { const { repository } = createRepository(); repository.recordRecent('2330'); repository.recordRecent('2454'); repository.recordRecent('2330'); expect(repository.getRecentSymbols()).toEqual(['2330', '2454']) })
  it('熱門搜尋由 Repository 管理', async () => { const { repository } = createRepository(); expect((await repository.getPopular(2)).map((item) => item.symbol)).toEqual(['2330', '2454']) })
  it('覆蓋率由索引實際資料計算', async () => { const { repository } = createRepository(); const coverage = await repository.getCoverage(); expect(coverage.officialStocks).toBe(5); expect(coverage.historyStocks).toBe(1); expect(coverage.decisionStocks).toBe(5) })
})
