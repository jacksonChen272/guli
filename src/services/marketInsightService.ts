import type { Industry } from '../types/industry'
import type { MarketEvent } from '../types/market'
import type { MarketHeadlineResult, MarketHighlight, RiskLevel } from '../types/insight'
import type { Stock } from '../types/stock'
import { marketRepository } from './dataRepository'

export interface MarketInsightContext { temperature: number; indexChangePercent: number; institutionalTotal: number; tradingAmountChangePercent: number; industries: Industry[]; stocks: Stock[]; events: MarketEvent[]; updatedAt: string }
const defaultContext = (): MarketInsightContext => { const overview = marketRepository.getOverview(); return { temperature: overview.temperature.score, indexChangePercent: overview.indices[0].changePercent, institutionalTotal: overview.institutionalFlows.foreign.value + overview.institutionalFlows.trust.value + overview.institutionalFlows.dealer.value, tradingAmountChangePercent: overview.tradingAmount.changePercent, industries: marketRepository.getIndustries(), stocks: marketRepository.getStocks(), events: marketRepository.getEvents(), updatedAt: marketRepository.getMetadata().updatedAt } }
const withContext = (overrides?: Partial<MarketInsightContext>): MarketInsightContext => ({ ...defaultContext(), ...overrides })
const sortedIndustries = (industries: Industry[]) => [...industries].sort((a, b) => b.changePercent - a.changePercent)

export function generateMarketHeadline(overrides?: Partial<MarketInsightContext>): MarketHeadlineResult {
  const context = withContext(overrides); const industries = sortedIndustries(context.industries); const strongest = industries[0]; const weakest = industries[industries.length - 1]; const up = context.stocks.filter((stock) => stock.changePercent > 0).length; const down = context.stocks.filter((stock) => stock.changePercent < 0).length
  const bullishSignals = [context.temperature >= 61, context.indexChangePercent > 0, context.institutionalTotal > 0, up > down, context.tradingAmountChangePercent > 0].filter(Boolean).length
  const marketState = bullishSignals >= 4 ? '偏多' : bullishSignals <= 1 ? '偏空' : context.temperature >= 61 ? '偏強' : context.temperature <= 40 ? '偏弱' : '中性'
  const breadthText = up > down ? '上漲家數占優' : '下跌家數較多'
  return { headline: `市場${marketState}，${context.indexChangePercent >= 0 ? '指數維持上揚' : '指數承受壓力'}，資金集中於${strongest.name}；${weakest.name}動能相對轉弱。`, tags: [strongest.name, context.institutionalTotal >= 0 ? '法人買超' : '法人賣超', breadthText], marketState, confidence: Math.min(96, Math.round(58 + Math.abs(context.temperature - 50) * .6 + Math.abs(up - down))), updatedAt: context.updatedAt, reasons: [`市場溫度 ${context.temperature} 分，加權指數 ${context.indexChangePercent >= 0 ? '上漲' : '下跌'} ${Math.abs(context.indexChangePercent).toFixed(2)}%。`, `三大法人合計 ${context.institutionalTotal >= 0 ? '買超' : '賣超'} ${Math.abs(context.institutionalTotal).toFixed(1)} 億元。`, `${breadthText}（${up} 漲／${down} 跌），成交金額較昨日 ${context.tradingAmountChangePercent >= 0 ? '增加' : '減少'} ${Math.abs(context.tradingAmountChangePercent).toFixed(1)}%。`, `最強產業為${strongest.name} ${strongest.changePercent >= 0 ? '+' : ''}${strongest.changePercent.toFixed(2)}%，最弱為${weakest.name} ${weakest.changePercent.toFixed(2)}%。`] }
}

const risk = (intensity: number, negative = false): RiskLevel => negative ? intensity >= 80 ? '高' : '中' : intensity >= 90 ? '中' : '低'
export function generateMarketHighlights(overrides?: Partial<MarketInsightContext>): MarketHighlight[] {
  const context = withContext(overrides); const industries = sortedIndustries(context.industries); const strongest = industries[0]; const weakest = industries[industries.length - 1]
  const foreignTurn = context.stocks.filter((stock) => stock.institutionalHistory.slice(-5).reduce((sum, item) => sum + item.foreign, 0) > 0 && stock.institutionalHistory.slice(-10, -5).reduce((sum, item) => sum + item.foreign, 0) <= 0).sort((a, b) => b.institutions.foreign - a.institutions.foreign)[0]
  const volumeStock = [...context.stocks].sort((a, b) => { const ratio = (stock: Stock) => stock.volume / (stock.priceHistory.slice(-20).reduce((sum, item) => sum + (item.volume ?? 0), 0) / 20); return ratio(b) - ratio(a) })[0]
  const breakout = [...context.stocks].filter((stock) => stock.price >= Math.max(...stock.priceHistory.slice(-20, -1).map((point) => point.value))).sort((a, b) => b.changePercent - a.changePercent)[0] ?? [...context.stocks].sort((a, b) => b.changePercent - a.changePercent)[0]
  const volatile = [...context.stocks].sort((a, b) => b.volatility - a.volatility)[0]
  return [
    { id: 'strong-industry', type: '最強產業', title: `${strongest.name}領漲市場`, description: `產業平均上漲 ${strongest.changePercent.toFixed(2)}%，資金流向與動能同步居前。`, related: [strongest.name], intensity: Math.min(100, Math.round(65 + strongest.changePercent * 6)), direction: 'positive', riskLevel: risk(72), targetPath: `/capital-flow?industry=${encodeURIComponent(strongest.name)}` },
    { id: 'weak-industry', type: '最弱產業', title: `${weakest.name}資金動能降溫`, description: `產業漲跌幅 ${weakest.changePercent.toFixed(2)}%，短線相對市場落後。`, related: [weakest.name], intensity: Math.min(100, Math.round(60 + Math.abs(weakest.changePercent) * 8)), direction: 'warning', riskLevel: risk(76, true), targetPath: `/capital-flow?industry=${encodeURIComponent(weakest.name)}` },
    { id: 'institution-turn', type: '法人異常', title: `${foreignTurn?.name ?? '台積電'}外資由賣轉買`, description: '近 5 日外資合計轉正，且今日法人合計維持買超。', related: [foreignTurn?.symbol ?? '2330', foreignTurn?.name ?? '台積電'], intensity: 78, direction: 'positive', riskLevel: '低', targetPath: `/stock/${foreignTurn?.symbol ?? '2330'}` },
    { id: 'volume', type: '成交量異常', title: `${volumeStock.name}成交量明顯放大`, description: '今日成交量高於近 20 日均量，需搭配價格方向持續觀察。', related: [volumeStock.symbol, volumeStock.name], intensity: 74, direction: volumeStock.changePercent >= 0 ? 'positive' : 'warning', riskLevel: volumeStock.changePercent >= 0 ? '中' : '高', targetPath: `/stock/${volumeStock.symbol}` },
    { id: 'breakout', type: '突破訊號', title: `${breakout.name}測試近期高點`, description: '價格接近或突破近 20 日區間上緣，量能是後續確認重點。', related: [breakout.symbol, breakout.industry], intensity: 82, direction: 'positive', riskLevel: '中', targetPath: `/stock/${breakout.symbol}` },
    { id: 'risk', type: '高風險訊號', title: `${volatile.name}短線波動升高`, description: `20 日波動率 ${volatile.volatility.toFixed(2)}%，部位控管重要性提高。`, related: [volatile.symbol, volatile.industry], intensity: 86, direction: 'warning', riskLevel: '高', targetPath: `/stock/${volatile.symbol}` },
    { id: 'event', type: '重要事件', title: context.events[1]?.title ?? '市場重要事件', description: '事件可能影響相關供應鏈的成交比重與短線資金選擇。', related: ['AI 伺服器'], intensity: 66, direction: 'neutral', riskLevel: '中', targetPath: '/market-focus' },
  ]
}
