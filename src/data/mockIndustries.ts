import { calculateStockHealth } from '../services/stockHealthService'
import type { Industry } from '../types/industry'
import { mockStocks } from './mockStocks'

const industryColors: Record<string, string> = {
  '半導體': '#53d9b2', 'AI 伺服器': '#7c9cff', 'PCB': '#f6b94a', '散熱': '#ff7287',
  '航運': '#4c9ee8', '金融': '#5ed5d1', '網通': '#c084fc', '被動元件': '#fb923c',
  '電源管理': '#a3e635', '電腦週邊': '#f472b6', '重電': '#facc15', '綠能': '#4ade80', '生技': '#60a5fa',
}

const round = (value: number) => Number(value.toFixed(1))

export const mockIndustries: Industry[] = Object.entries(industryColors).map(([name, color], index) => {
  const stocks = mockStocks.filter((stock) => stock.industry === name)
  const source = stocks.length ? stocks : [mockStocks[index % mockStocks.length]]
  const average = (values: number[]) => round(values.reduce((sum, value) => sum + value, 0) / values.length)
  const institutions = source.reduce((sum, stock) => ({ foreign: sum.foreign + stock.institutions.foreign, trust: sum.trust + stock.institutions.trust, dealer: sum.dealer + stock.institutions.dealer, total: sum.total + stock.institutions.total }), { foreign: 0, trust: 0, dealer: 0, total: 0 })
  return {
    id: `industry-${index + 1}`, name, color,
    changePercent: average(source.map((stock) => stock.changePercent)),
    capitalFlow: average(source.map((stock) => stock.capitalFlow)),
    momentum: average(source.map((stock) => stock.momentum)),
    cumulative20d: average(source.map((stock) => stock.cumulative20d)),
    healthScore: average(source.map((stock) => calculateStockHealth(stock, mockStocks).totalScore)),
    institutions: { foreign: round(institutions.foreign), trust: round(institutions.trust), dealer: round(institutions.dealer), total: round(institutions.total) },
    stockSymbols: stocks.map((stock) => stock.symbol),
  }
})
