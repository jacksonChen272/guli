import type { MarketIndex, MarketTemperatureData, PricePoint } from '../types/market'
import { tradingDates } from './mockStocks'

const makeTrend = (endValue: number, volatility: number, slope: number): PricePoint[] => tradingDates.map((date, index) => ({
  date,
  value: Math.round((endValue + (index - 19) * slope + Math.sin(index * .82) * volatility) * 100) / 100,
}))

export const mockMarketIndices: MarketIndex[] = [
  { code: 'TAIEX', name: '加權指數', value: 23172.43, change: 186.52, changePercent: .81, previousValue: 22985.91, trend: makeTrend(23172.43, 76, 22) },
  { code: 'TPEX', name: '櫃買指數', value: 267.82, change: 1.16, changePercent: .43, previousValue: 266.66, trend: makeTrend(267.82, 1.6, .18) },
]

export const mockTradingAmount = {
  value: 4682,
  change: 318,
  changePercent: 7.29,
  previousValue: 4364,
  trend: makeTrend(4682, 230, 42),
}

export const mockInstitutionalFlows = {
  foreign: { value: 126.8, change: 48.2, changePercent: 61.32, previousValue: 78.6, trend: makeTrend(126.8, 24, 5.4) },
  trust: { value: 32.4, change: 8.7, changePercent: 36.71, previousValue: 23.7, trend: makeTrend(32.4, 6, 1.2) },
  dealer: { value: -18.6, change: -6.2, changePercent: -50, previousValue: -12.4, trend: makeTrend(-18.6, 5, -.6) },
}

export const mockMarketTemperature: MarketTemperatureData = {
  score: 72,
  weather: '晴天',
  reasons: [
    { label: '法人流向', value: 82, description: '三大法人合計買超 140.6 億' },
    { label: '成交量', value: 68, description: '成交金額較昨日增加 7.3%' },
    { label: '上漲家數', value: 74, description: '上市櫃上漲家數 1,126 家' },
    { label: '市場動能', value: 71, description: '短中期動能維持正向' },
  ],
}
