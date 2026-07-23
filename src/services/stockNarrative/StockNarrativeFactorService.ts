import type { StockNarrativeFactor, StockNarrativeInput } from '../../types/stockNarrative'

export function buildStockNarrativeFactors(input: StockNarrativeInput): StockNarrativeFactor[] {
  const factors: StockNarrativeFactor[] = []
  const add = (factor: StockNarrativeFactor) => factors.push(factor)
  if (input.close !== null && input.ma20 !== null) add({ code: 'price-ma20', label: '中期趨勢', direction: input.close >= input.ma20 ? 'positive' : 'negative', explanation: `收盤價${input.close >= input.ma20 ? '站上' : '低於'} MA20。`, source: 'TWSE Official History / Derived', tradeDate: input.tradeDate })
  if (input.close !== null && input.ma60 !== null) add({ code: 'price-ma60', label: '波段結構', direction: input.close >= input.ma60 ? 'positive' : 'negative', explanation: `收盤價${input.close >= input.ma60 ? '位於' : '跌破'} MA60。`, source: 'TWSE Official History / Derived', tradeDate: input.tradeDate })
  if (input.macdHistogram !== null) add({ code: 'macd', label: 'MACD 動能', direction: input.macdHistogram > 0 ? 'positive' : input.macdHistogram < 0 ? 'negative' : 'neutral', explanation: `MACD 柱狀值為 ${input.macdHistogram.toFixed(2)}。`, source: 'GULI Derived', tradeDate: input.tradeDate })
  if (input.rsi14 !== null) add({ code: 'rsi', label: 'RSI 狀態', direction: input.rsi14 >= 75 ? 'negative' : input.rsi14 >= 50 ? 'positive' : input.rsi14 <= 30 ? 'neutral' : 'negative', explanation: `RSI14 為 ${input.rsi14.toFixed(1)}${input.rsi14 >= 75 ? '，短線偏熱' : input.rsi14 <= 30 ? '，位於偏低區' : ''}。`, source: 'GULI Derived', tradeDate: input.tradeDate })
  if (input.volumeRatio !== null) add({ code: 'volume', label: '成交量', direction: input.volumeRatio >= 1.2 ? 'positive' : input.volumeRatio < 0.65 ? 'negative' : 'neutral', explanation: `成交量為 20 日均量的 ${input.volumeRatio.toFixed(2)} 倍。`, source: 'TWSE Official History / Derived', tradeDate: input.tradeDate })
  if (input.institutionalNetShares !== null) add({ code: 'institutional', label: '法人方向', direction: input.institutionalNetShares > 0 ? 'positive' : input.institutionalNetShares < 0 ? 'negative' : 'neutral', explanation: `三大法人單日合計${input.institutionalNetShares >= 0 ? '買超' : '賣超'} ${Math.abs(input.institutionalNetShares).toLocaleString('zh-TW')} 股。`, source: 'TWSE Official Institutional', tradeDate: input.tradeDate })
  if (input.industryRelativeStrength !== null) add({ code: 'industry', label: '產業相對強度', direction: input.industryRelativeStrength >= 60 ? 'positive' : input.industryRelativeStrength < 45 ? 'negative' : 'neutral', explanation: `產業相對強度為 ${input.industryRelativeStrength.toFixed(1)}。`, source: 'GULI Industry Snapshot', tradeDate: input.tradeDate })
  if (input.decisionScore !== null) add({ code: 'decision', label: 'GULI 決策', direction: input.decisionScore >= 66 ? 'positive' : input.decisionScore < 45 ? 'negative' : 'neutral', explanation: `Decision Score 為 ${input.decisionScore.toFixed(1)}。`, source: 'decision-v1.0', tradeDate: input.tradeDate })
  return factors
}
