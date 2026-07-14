import { repositoryHub } from '../repositories/RepositoryHub'
import type { MarketOverviewData } from '../types/api'

export { repositoryHub }

export const marketRepository = {
  getStocks: () => repositoryHub.stocks.getSnapshot(),
  getStock: (symbol: string) => repositoryHub.stocks.getSnapshot().find((stock) => stock.symbol === symbol),
  getIndustries: () => repositoryHub.industries.getSnapshot(),
  getEvents: () => repositoryHub.getSnapshot().events,
  getSignals: () => repositoryHub.getSnapshot().signals,
  getOverview: (): MarketOverviewData => repositoryHub.getSnapshot().overview,
  getRotation: () => repositoryHub.getSnapshot().rotation,
  getTradingDates: () => repositoryHub.getSnapshot().tradingDates,
  getMetadata: () => repositoryHub.getMetadata(),
}
