import type { HotStockItem } from '../types/dashboardIntelligence'
import type { OfficialStockDailyRecord } from '../types/officialStockData'

export interface HotStocksDependencies {
  getStocks: () => Promise<OfficialStockDailyRecord[]>
}

const percentile = (values: number[], value: number) => {
  if (values.length <= 1) return 100
  const belowOrEqual = values.filter((candidate) => candidate <= value).length - 1
  return Math.max(0, Math.min(100, belowOrEqual / (values.length - 1) * 100))
}

export function rankHotStocks(records: OfficialStockDailyRecord[], limit = 5): HotStockItem[] {
  const valid = records.filter((record) => record.instrumentType === 'stock' && record.status !== 'invalid'
    && record.tradeValue !== null && record.tradeVolume !== null && record.change !== null && record.close !== null)
  const amounts = valid.map((record) => record.tradeValue!)
  const volumes = valid.map((record) => record.tradeVolume!)
  const moves = valid.map((record) => Math.abs(record.change! / Math.max(record.close! - record.change!, 0.01) * 100))

  return valid.map((record) => {
    const changePercent = record.change === null || record.close === null ? null : record.change / Math.max(record.close - record.change, 0.01) * 100
    const amountRank = percentile(amounts, record.tradeValue!)
    const volumeRank = percentile(volumes, record.tradeVolume!)
    const moveRank = percentile(moves, Math.abs(changePercent ?? 0))
    const hotScore = Math.round((amountRank * 0.45 + volumeRank * 0.3 + moveRank * 0.25) * 10) / 10
    const reasons = [
      amountRank >= 90 ? '成交值位居市場前 10%' : null,
      volumeRank >= 90 ? '成交量位居市場前 10%' : null,
      moveRank >= 90 ? `今日振幅關注度高（${changePercent! > 0 ? '+' : ''}${changePercent!.toFixed(2)}%）` : null,
    ].filter((value): value is string => Boolean(value))
    return { symbol: record.symbol, name: record.name, close: record.close, changePercent, tradingAmount: record.tradeValue, tradingVolume: record.tradeVolume, hotScore, rank: 0, reasons: reasons.length ? reasons : ['成交值、成交量與漲跌幅綜合排序'], tradeDate: record.tradeDate, source: 'TWSE Official' as const }
  }).sort((left, right) => right.hotScore - left.hotScore || (right.tradingAmount ?? 0) - (left.tradingAmount ?? 0) || left.symbol.localeCompare(right.symbol))
    .slice(0, Math.max(0, limit)).map((item, index) => ({ ...item, rank: index + 1 }))
}

export class HotStocksRepository {
  private cached: HotStockItem[] | null = null
  constructor(private readonly dependencies: HotStocksDependencies) {}
  async getTop(limit = 5, force = false) {
    if (!force && this.cached) return this.cached.slice(0, limit)
    this.cached = rankHotStocks(await this.dependencies.getStocks(), Number.MAX_SAFE_INTEGER)
    return this.cached.slice(0, limit)
  }
  clearCache() { this.cached = null }
}

