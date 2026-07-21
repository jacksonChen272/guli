import { describe, expect, it } from 'vitest'
import { calculateMarketSentiment, classifyMarketSentiment } from '../MarketSentimentService'
import type { DecisionResult } from '../../../types/decision'
import type { OfficialMarketOverview } from '../../../types/marketData'
import type { InstitutionalMarketTotals } from '../../../types/officialInstitutionalData'

const market = (changePercent = 1, advance = 700, decline = 300, amount = 500_000_000_000): OfficialMarketOverview => ({ schemaVersion: '2.0', market: 'TWSE', tradeDate: '2026-07-20', indexName: '發行量加權股價指數', indexValue: 24_000, change: changePercent * 240, changePercent, tradingAmount: amount, tradingVolume: 9_000_000_000, transactionCount: 1_000_000, advanceCount: advance, declineCount: decline, unchangedCount: 100, limitUpCount: null, limitDownCount: null, breadthSource: 'stock_day_all', tradingHistory: Array.from({ length: 20 }, (_, index) => ({ tradeDate: `2026-06-${String(index + 1).padStart(2, '0')}`, indexValue: 23_000 + index * 20, tradingAmount: 400_000_000_000, tradingVolume: 8_000_000_000, transactionCount: 900_000 })), rankings: { tradingAmount: [], tradingVolume: [], gainers: [], losers: [] }, source: 'TWSE', fetchedAt: '2026-07-20T08:00:00Z', status: 'official', warnings: [] })
const institutions = (foreign: number): InstitutionalMarketTotals => ({ foreign: { buyAmount: 100, sellAmount: 100 - foreign, netAmount: foreign }, trust: { buyAmount: 20, sellAmount: 20, netAmount: 0 }, dealer: { buyAmount: 10, sellAmount: 10, netAmount: 0 }, total: { buyAmount: 130, sellAmount: 130 - foreign, netAmount: foreign } })
const decision = (score: number, direction: DecisionResult['direction'], confidence = 80): DecisionResult => ({ entityType: 'market', entityId: 'TWSE', entityName: '市場', tradeDate: '2026-07-20', score, label: direction === 'bullish' ? '偏強' : direction === 'bearish' ? '偏弱' : '中性', direction, confidence, summary: '', factors: [], risks: [], trace: { formulaVersion: 'decision-v1.0', totalPositiveContribution: 0, totalNegativeContribution: 0, totalContribution: 0, availableWeight: 1, missingWeight: 0, normalizationApplied: false, calculationSteps: [] }, sources: [], warnings: [] })

describe('market-sentiment-v1', () => {
  it('正向市場資料產生偏多以上分數', () => expect(calculateMarketSentiment({ market: market(), institutions: institutions(50_000_000_000), decision: decision(78, 'bullish') }).score).toBeGreaterThanOrEqual(60))
  it('負向市場資料產生偏空分數', () => expect(calculateMarketSentiment({ market: market(-1, 250, 750), institutions: institutions(-60_000_000_000), decision: decision(25, 'bearish') }).score).toBeLessThan(40))
  it('相同輸入永遠得到相同結果', () => { const input = { market: market(), institutions: institutions(10), decision: decision(60, 'neutral') }; expect(calculateMarketSentiment(input)).toEqual(calculateMarketSentiment(input)) })
  it('分數一定介於 0 到 100', () => { const result = calculateMarketSentiment({ market: market(9, 1000, 0), institutions: institutions(9e15), decision: decision(100, 'bullish', 100) }); expect(result.score).toBeGreaterThanOrEqual(0); expect(result.score).toBeLessThanOrEqual(100) })
  it('缺少部分來源時依可用權重正規化', () => { const result = calculateMarketSentiment({ market: market(), institutions: null, decision: null }); expect(result.score).not.toBeNull(); expect(result.confidence).toBe(40); expect(result.warnings).toHaveLength(3) })
  it('完全缺資料時不虛構分數', () => expect(calculateMarketSentiment({ market: null, institutions: null, decision: null }).score).toBeNull())
  it('每個因子揭露權重與來源', () => { const factors = calculateMarketSentiment({ market: market(), institutions: institutions(1), decision: decision(50, 'neutral') }).factors; expect(factors.map((factor) => factor.weight)).toEqual([30, 25, 20, 15, 10]); expect(factors.some((factor) => factor.sourceType === 'official')).toBe(true) })
  it('保留指定公式版本', () => expect(calculateMarketSentiment({ market: null, institutions: null, decision: null }).formulaVersion).toBe('market-sentiment-v1'))
  it.each([[0, '極度恐慌'], [20, '偏空'], [40, '中性'], [60, '偏多'], [80, '樂觀'], [100, '樂觀']] as const)('分數 %s 分級為 %s', (score, label) => expect(classifyMarketSentiment(score).label).toBe(label))
})
