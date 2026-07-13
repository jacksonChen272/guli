import type { RotationPoint } from '../types/market'
import { mockIndustries } from './mockIndustries'
import { mockStocks, tradingDates } from './mockStocks'

const makeHistory = (seed: number, flow: number, momentum: number) => tradingDates.map((date, index) => ({
  date,
  capitalFlow: Math.round((flow * (.48 + index / 38) + Math.sin(index * .7 + seed) * 1.8) * 10) / 10,
  momentum: Math.round((momentum * (.52 + index / 40) + Math.cos(index * .62 + seed) * 1.2) * 10) / 10,
}))

export const stockRotationPoints: RotationPoint[] = mockStocks.map((stock, index) => ({
  id: stock.symbol,
  name: stock.name,
  industry: stock.industry,
  price: stock.price,
  capitalFlow: stock.capitalFlow,
  momentum: stock.momentum,
  cumulative20d: stock.cumulative20d,
  changePercent: stock.changePercent,
  healthScore: stock.healthScore,
  institutions: stock.institutions,
  history: makeHistory(index, stock.capitalFlow, stock.momentum),
}))

export const industryRotationPoints: RotationPoint[] = mockIndustries.map((industry, index) => ({
  id: industry.id,
  name: industry.name,
  industry: industry.name,
  capitalFlow: industry.capitalFlow,
  momentum: industry.momentum,
  cumulative20d: industry.cumulative20d,
  changePercent: industry.changePercent,
  healthScore: industry.healthScore,
  institutions: industry.institutions,
  history: makeHistory(index + 30, industry.capitalFlow, industry.momentum),
}))
