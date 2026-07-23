import type { StockNarrativeFactor, StockNarrativeInput } from '../../types/stockNarrative'

export function buildStockNarrativeRisks(input: StockNarrativeInput, factors: StockNarrativeFactor[]): StockNarrativeFactor[] {
  const risks = factors.filter((factor) => factor.direction === 'negative')
  if (input.highRiskCount > 0) risks.push({ code: 'risk-count', label: '風險規則', direction: 'negative', explanation: `目前觸發 ${input.highRiskCount} 項高風險規則。`, source: 'stock-risk-v1.0', tradeDate: input.tradeDate })
  if (input.stale) risks.push({ code: 'stale', label: '資料時效', direction: 'negative', explanation: '部分資料可能不是最近合理交易日，解讀時需留意時效。', source: 'GULI Data Guard', tradeDate: input.tradeDate })
  return risks
}
