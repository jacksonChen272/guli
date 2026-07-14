import { mockIndustries } from '../data/mockIndustries'
import { insightUpdatedAt, mockInsightEvents } from '../data/mockInsights'
import { mockInstitutionalFlows, mockMarketIndices, mockMarketTemperature, mockTradingAmount } from '../data/mockMarket'
import { mockSignals } from '../data/mockSignals'
import { mockStocks, tradingDates } from '../data/mockStocks'
import { industryRotationPoints, stockRotationPoints } from '../data/mockRotation'
import type { MarketDataProvider } from './dataProvider'
import type { DataResult, InstitutionalTradeRecord, MarketOverviewData } from '../types/api'
import type { Industry } from '../types/industry'
import type { MarketEvent, MarketSignal } from '../types/market'
import type { Stock } from '../types/stock'
import { createDataResult } from './dataNormalizationService'

export const MOCK_DATA_SOURCE = 'GULI 集中式模擬資料'
export const MOCK_UPDATED_AT = insightUpdatedAt
const stale = true
const warning = '目前為模擬資料，尚未接入即時或盤後市場資料。'

export const mockDataSnapshot = {
  stocks: mockStocks,
  industries: mockIndustries,
  events: mockInsightEvents,
  signals: mockSignals,
  overview: { indices: mockMarketIndices, tradingAmount: mockTradingAmount, institutionalFlows: mockInstitutionalFlows, temperature: mockMarketTemperature } satisfies MarketOverviewData,
  rotation: { industry: industryRotationPoints, stock: stockRotationPoints },
  tradingDates,
}

const result = <T>(data: T): DataResult<T> => createDataResult(data, { source: MOCK_DATA_SOURCE, updatedAt: MOCK_UPDATED_AT, warnings: [warning], stale })

export class MockDataProvider implements MarketDataProvider {
  getMarketOverview() { return Promise.resolve(result(mockDataSnapshot.overview)) }
  getStocks() { return Promise.resolve(result<Stock[]>(mockDataSnapshot.stocks)) }
  getStockDetail(symbol: string) { return Promise.resolve(result<Stock | null>(mockDataSnapshot.stocks.find((stock) => stock.symbol === symbol) ?? null)) }
  getInstitutionalTrades(date: string) { const records: InstitutionalTradeRecord[] = mockDataSnapshot.stocks.map((stock) => ({ symbol: stock.symbol, date, flow: stock.institutionalHistory.find((entry) => entry.date === date) ?? stock.institutions })); return Promise.resolve(result(records)) }
  getIndustryData() { return Promise.resolve(result<Industry[]>(mockDataSnapshot.industries)) }
  getMarketEvents() { return Promise.resolve(result<MarketEvent[]>(mockDataSnapshot.events)) }
  getLastUpdatedAt() { return Promise.resolve(MOCK_UPDATED_AT) }
}

export const mockDataProvider = new MockDataProvider()
export const getMockSignals = (): MarketSignal[] => mockDataSnapshot.signals
