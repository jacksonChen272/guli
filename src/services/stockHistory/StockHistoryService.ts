import type { OfficialStockHistory, OfficialStockHistoryPrice } from '../../types/officialStockHistory'

export function getRecentHistory(dataset: OfficialStockHistory, tradingDays: number): OfficialStockHistoryPrice[] {
  if (!Number.isInteger(tradingDays) || tradingDays <= 0) return []
  return dataset.prices.slice(-tradingDays)
}

export function getHistoryRange(dataset: OfficialStockHistory, startDate: string, endDate: string): OfficialStockHistoryPrice[] {
  return dataset.prices.filter((point) => point.tradeDate >= startDate && point.tradeDate <= endDate)
}

