import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'

export function mergeStockHistory(
  existing: OfficialStockHistoryPrice[],
  incoming: OfficialStockHistoryPrice[],
): OfficialStockHistoryPrice[] {
  const byDate = new Map<string, OfficialStockHistoryPrice>()
  existing.forEach((point) => byDate.set(point.tradeDate, point))
  incoming.forEach((point) => byDate.set(point.tradeDate, point))
  return [...byDate.values()].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate))
}

