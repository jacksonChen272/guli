import type { MarketSnapshot, MarketSnapshotDiff, SnapshotValueDiff } from '../../types/snapshot'
const valueDiff = (current: number | null, previous: number | null): SnapshotValueDiff => ({ current, previous, change: current === null || previous === null ? null : Number((current - previous).toFixed(2)) })
const names = (values: Array<{ name: string }>) => values.map((value) => value.name)
const added = (current: string[], previous: string[]) => current.filter((value) => !previous.includes(value))
export class SnapshotDiffService {
  compare(current: MarketSnapshot, previous?: MarketSnapshot | null): MarketSnapshotDiff {
    if (!previous) return { hasPrevious: false, currentDate: current.tradeDate, previousDate: null, temperature: valueDiff(current.marketTemperature, null), index: valueDiff(current.overview.indexValue, null), tradingAmount: valueDiff(current.overview.tradingAmount, null), marketStatusChanged: false, previousMarketStatus: null, currentMarketStatus: current.marketStatus, addedTopIndustries: [], removedTopIndustries: [], addedWeakIndustries: [], removedWeakIndustries: [] }
    const currentTop = names(current.topIndustries); const previousTop = names(previous.topIndustries); const currentWeak = names(current.weakIndustries); const previousWeak = names(previous.weakIndustries)
    return { hasPrevious: true, currentDate: current.tradeDate, previousDate: previous.tradeDate, temperature: valueDiff(current.marketTemperature, previous.marketTemperature), index: valueDiff(current.overview.indexValue, previous.overview.indexValue), tradingAmount: valueDiff(current.overview.tradingAmount, previous.overview.tradingAmount), marketStatusChanged: current.marketStatus !== previous.marketStatus, previousMarketStatus: previous.marketStatus, currentMarketStatus: current.marketStatus, addedTopIndustries: added(currentTop, previousTop), removedTopIndustries: added(previousTop, currentTop), addedWeakIndustries: added(currentWeak, previousWeak), removedWeakIndustries: added(previousWeak, currentWeak) }
  }
}
