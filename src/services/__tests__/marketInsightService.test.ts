import { describe, expect, it } from 'vitest'
import { marketRepository } from '../dataRepository'
import { generateMarketHeadline, generateMarketHighlights } from '../marketInsightService'

describe('marketInsightService', () => {
  it('偏多資料產生偏多市場結論', () => { const stocks = marketRepository.getStocks().map((stock) => ({ ...stock, changePercent: Math.abs(stock.changePercent) + 1 })); const result = generateMarketHeadline({ temperature: 82, indexChangePercent: 1.8, institutionalTotal: 180, tradingAmountChangePercent: 12, stocks }); expect(result.marketState).toBe('偏多'); expect(result.headline).toContain('偏多') })
  it('偏空資料產生偏空市場結論', () => { const stocks = marketRepository.getStocks().map((stock) => ({ ...stock, changePercent: -Math.abs(stock.changePercent) - 1 })); const result = generateMarketHeadline({ temperature: 18, indexChangePercent: -2.1, institutionalTotal: -220, tradingAmountChangePercent: -15, stocks }); expect(result.marketState).toBe('偏空'); expect(result.tags).toContain('法人賣超') })
  it('焦點依規則包含產業、法人與風險類型', () => { const types = generateMarketHighlights().map((item) => item.type); expect(types).toEqual(expect.arrayContaining(['最強產業', '最弱產業', '法人異常', '高風險訊號'])) })
})
