import { describe, expect, it } from 'vitest'
import { getStockSearchPriority, rankSearchCandidates } from '../SearchRankingService'
import type { SearchStockIndexItem } from '../../../types/search'

const stock = (symbol: string, name: string, popularityScore = 0): SearchStockIndexItem => ({ kind: 'stock', id: `stock:${symbol}`, symbol, name, englishName: null, industry: '半導體業', market: 'TWSE', marketLabel: '上市', close: 100, changePercent: 1, tradeVolume: 10, tradeValue: 10, hasOfficialQuote: true, hasHistory: false, hasTechnical: false, hasDecision: true, hasSnapshot: true, decisionScore: null, technicalScore: null, healthScore: null, snapshotScore: 60, popularityScore, tradeDate: '2026-07-20' })

describe('SearchRankingService', () => {
  it('完全代碼符合為 Priority 1', () => expect(getStockSearchPriority(stock('2330', '台積電'), '2330')?.priority).toBe(1))
  it('代碼開頭符合為 Priority 2', () => expect(getStockSearchPriority(stock('2330', '台積電'), '23')?.priority).toBe(2))
  it('名稱開頭符合為 Priority 3', () => expect(getStockSearchPriority(stock('2330', '台積電'), '台積')?.priority).toBe(3))
  it('名稱包含符合為 Priority 4', () => expect(getStockSearchPriority(stock('2330', '台灣積體電路'), '積體')?.priority).toBe(4))
  it('模糊搜尋為 Priority 5', () => expect(getStockSearchPriority(stock('2330', '台灣積體電路'), '台積電')?.priority).toBe(5))
  it('同優先序以熱門權重穩定排序', () => { const results = rankSearchCandidates('23', [stock('2303', '聯電', 1), stock('2330', '台積電', 4), stock('2317', '鴻海', 2), stock('2324', '仁寶', 3)]); expect(results.map((item) => item.item.kind === 'stock' ? item.item.symbol : '')).toEqual(['2330', '2324', '2317', '2303']) })
})
