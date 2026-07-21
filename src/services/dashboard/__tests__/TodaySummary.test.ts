import { describe, expect, it } from 'vitest'
import { generateTodaySummary } from '../TodaySummaryService'
import type { MarketSentimentResult } from '../../../types/dashboardIntelligence'
import type { OfficialMarketOverview } from '../../../types/marketData'
import type { InstitutionalMarketTotals } from '../../../types/officialInstitutionalData'

const sentiment = (score: number | null, label = score === null ? '資料不足' : score >= 60 ? '偏多' : score < 40 ? '偏空' : '中性'): MarketSentimentResult => ({ score, level: score === null ? 'neutral' : score >= 80 ? 'optimistic' : score >= 60 ? 'bullish' : score < 20 ? 'extreme-fear' : score < 40 ? 'bearish' : 'neutral', label, confidence: score === null ? 0 : 100, formulaVersion: 'market-sentiment-v1', tradeDate: '2026-07-20', factors: [], warnings: [] })
const market = (indexValue = 100): OfficialMarketOverview => ({ schemaVersion: '2.0', market: 'TWSE', tradeDate: '2026-07-20', indexName: '加權指數', indexValue, change: 1, changePercent: 1, tradingAmount: 100, tradingVolume: 100, transactionCount: 10, advanceCount: 600, declineCount: 400, unchangedCount: 100, limitUpCount: null, limitDownCount: null, breadthSource: 'stock_day_all', tradingHistory: Array.from({ length: 20 }, (_, index) => ({ tradeDate: `2026-06-${String(index + 1).padStart(2, '0')}`, indexValue: 100, tradingAmount: 100, tradingVolume: 100, transactionCount: 10 })), rankings: { tradingAmount: [], tradingVolume: [], gainers: [], losers: [] }, source: 'TWSE', fetchedAt: '2026-07-20T08:00:00Z', status: 'official', warnings: [] })
const institutions = (foreign: number): InstitutionalMarketTotals => ({ foreign: { buyAmount: 100, sellAmount: 100 - foreign, netAmount: foreign }, trust: { buyAmount: 10, sellAmount: 10, netAmount: 0 }, dealer: { buyAmount: 10, sellAmount: 10, netAmount: 0 }, total: { buyAmount: 120, sellAmount: 120 - foreign, netAmount: foreign } })

describe('today-summary-v1.0', () => {
  it('偏多分數產生偏多觀察文字', () => { const result = generateTodaySummary({ sentiment: sentiment(70), market: market(102), institutions: institutions(10) }); expect(result.stance).toBe('bullish'); expect(result.text).toContain('趨勢延續') })
  it('偏空分數產生風險控制文字', () => { const result = generateTodaySummary({ sentiment: sentiment(30), market: market(98), institutions: institutions(-10) }); expect(result.stance).toBe('bearish'); expect(result.text).toContain('控制風險') })
  it('中性分數要求等待確認', () => expect(generateTodaySummary({ sentiment: sentiment(50), market: market(), institutions: institutions(0) }).text).toContain('等待方向確認'))
  it('缺資料時不推測方向', () => { const result = generateTodaySummary({ sentiment: sentiment(null), market: null, institutions: null }); expect(result.stance).toBe('unknown'); expect(result.text).toContain('資料尚未齊全') })
  it('外資買超與賣超使用實際符號', () => { expect(generateTodaySummary({ sentiment: sentiment(60), market: market(), institutions: institutions(10) }).text).toContain('外資買超'); expect(generateTodaySummary({ sentiment: sentiment(40), market: market(), institutions: institutions(-10) }).text).toContain('外資賣超') })
  it('指數距月線一個百分點內標示接近月線', () => expect(generateTodaySummary({ sentiment: sentiment(50), market: market(100.5), institutions: null }).text).toContain('接近月線'))
  it('揭露漲跌家數差', () => expect(generateTodaySummary({ sentiment: sentiment(50), market: market(), institutions: null }).reasons.join(' ')).toContain('+200'))
  it('不使用 GPT 或隨機文案', () => { const input = { sentiment: sentiment(60), market: market(), institutions: institutions(5) }; expect(generateTodaySummary(input)).toEqual(generateTodaySummary(input)); expect(generateTodaySummary(input).text).not.toMatch(/GPT|AI 生成/) })
  it('保留指定公式版本', () => expect(generateTodaySummary({ sentiment: sentiment(50), market: null, institutions: null }).formulaVersion).toBe('today-summary-v1.0'))
})

