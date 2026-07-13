import type { Industry } from '../types/industry'
import { mockStocks } from './mockStocks'

const industryColors: Record<string, string> = {
  '半導體': '#32e2b0', 'AI 伺服器': '#8b7cff', 'PCB': '#f6b94a', '散熱': '#ff6b81',
  '航運': '#35a7ff', '金融': '#5ed5d1', '網通': '#c084fc', '被動元件': '#fb923c',
  '電源管理': '#a3e635', '電腦週邊': '#f472b6', '重電': '#facc15', '生技醫療': '#60a5fa', '綠能': '#4ade80',
}

const round = (value: number) => Math.round(value * 10) / 10

export const mockIndustries: Industry[] = Object.entries(industryColors).map(([name, color], index) => {
  const stocks = mockStocks.filter((stock) => stock.industry === name)
  const fallback = mockStocks[index % mockStocks.length]
  const source = stocks.length ? stocks : [fallback]
  const average = (key: 'changePercent' | 'capitalFlow' | 'momentum' | 'cumulative20d' | 'healthScore') => round(source.reduce((sum, stock) => sum + stock[key], 0) / source.length)
  const institutions = source.reduce((sum, stock) => ({
    foreign: sum.foreign + stock.institutions.foreign,
    trust: sum.trust + stock.institutions.trust,
    dealer: sum.dealer + stock.institutions.dealer,
    total: sum.total + stock.institutions.total,
  }), { foreign: 0, trust: 0, dealer: 0, total: 0 })
  return {
    id: `industry-${index + 1}`,
    name, color,
    changePercent: average('changePercent'),
    capitalFlow: average('capitalFlow'),
    momentum: average('momentum'),
    cumulative20d: average('cumulative20d'),
    healthScore: average('healthScore'),
    institutions: { foreign: round(institutions.foreign), trust: round(institutions.trust), dealer: round(institutions.dealer), total: round(institutions.total) },
    stockSymbols: stocks.map((stock) => stock.symbol),
  }
})
