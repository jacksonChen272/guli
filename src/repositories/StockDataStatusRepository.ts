import { calculateStockHealth } from '../services/stockHealthService'
import { availability, calculateSearchCoverage, finiteOrNull, scoreStatus } from '../services/search/DataStatusService'
import type { DecisionResult } from '../types/decision'
import type { OfficialIndustryMappingDataset } from '../types/officialIndustryMapping'
import type { OfficialStockDailyRecord } from '../types/officialStockData'
import type { ScreenerDataset, TechnicalIndexDataset } from '../types/screener'
import type { SearchCoverage, SearchIndexSourceRecord, SearchStockIndexItem, StockSearchPreview, DecisionDatasetSummary } from '../types/search'
import type { Stock } from '../types/stock'
import type { StockSnapshotDailyIndex, StockSnapshotItem } from '../types/stockSnapshot'

export interface StockDataStatusDependencies {
  getStocks: () => Promise<OfficialStockDailyRecord[]>
  getIndustryMapping: () => Promise<OfficialIndustryMappingDataset>
  getHistorySymbols: () => Promise<string[]>
  getTechnicalIndex: () => Promise<TechnicalIndexDataset>
  getScreener: () => Promise<ScreenerDataset>
  getSnapshotIndex: () => Promise<StockSnapshotDailyIndex>
  getDecisionSummary: () => Promise<DecisionDatasetSummary>
  getDecision: (symbol: string) => Promise<DecisionResult>
  getSnapshot: (symbol: string) => Promise<StockSnapshotItem>
  getMockStocks: () => Stock[]
}

interface StatusIndexData {
  records: SearchIndexSourceRecord[]
  coverage: SearchCoverage
  builtAt: string
  tradeDate: string | null
}

const changePercent = (quote: OfficialStockDailyRecord) => {
  if (quote.close === null || quote.change === null) return null
  const previousClose = quote.close - quote.change
  return previousClose > 0 ? quote.change / previousClose * 100 : null
}

const latestIso = (values: Array<string | null | undefined>) => values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null

export class StockDataStatusRepository {
  private indexPromise: Promise<StatusIndexData> | null = null
  private readonly previewCache = new Map<string, Promise<StockSearchPreview>>()

  constructor(private readonly dependencies: StockDataStatusDependencies) {}

  private async buildIndex(): Promise<StatusIndexData> {
    const [stocks, mapping, historySymbols, technical, screener, snapshots, decisionSummary] = await Promise.all([
      this.dependencies.getStocks(),
      this.dependencies.getIndustryMapping(),
      this.dependencies.getHistorySymbols().catch(() => []),
      this.dependencies.getTechnicalIndex().catch(() => null),
      this.dependencies.getScreener().catch(() => null),
      this.dependencies.getSnapshotIndex().catch(() => null),
      this.dependencies.getDecisionSummary().catch(() => null),
    ])
    const industryBySymbol = new Map(mapping.stocks.map((item) => [item.symbol, item]))
    const historySet = new Set(historySymbols)
    const technicalBySymbol = new Map(technical?.records.map((item) => [item.symbol, item]) ?? [])
    const snapshotBySymbol = new Map(snapshots?.records.map((item) => [item.symbol, item]) ?? [])
    const screenerBySymbol = new Map<string, ScreenerDataset['results'][number]>()
    for (const result of screener?.results ?? []) {
      const current = screenerBySymbol.get(result.symbol)
      const completeness = [result.decisionScore, result.technicalScore, result.healthScore, result.snapshotScore].filter((value) => finiteOrNull(value) !== null).length
      const currentCompleteness = current ? [current.decisionScore, current.technicalScore, current.healthScore, current.snapshotScore].filter((value) => finiteOrNull(value) !== null).length : -1
      if (!current || completeness > currentCompleteness) screenerBySymbol.set(result.symbol, result)
    }
    const decisionComplete = Boolean(decisionSummary && decisionSummary.stockCount >= stocks.length)
    const records = stocks.map<SearchIndexSourceRecord>((quote) => {
      const industry = industryBySymbol.get(quote.symbol)
      const technicalEntry = technicalBySymbol.get(quote.symbol)
      const snapshot = snapshotBySymbol.get(quote.symbol)
      const screenerEntry = screenerBySymbol.get(quote.symbol)
      return {
        symbol: quote.symbol,
        name: quote.name,
        englishName: null,
        industry: industry?.industryName ?? null,
        close: finiteOrNull(quote.close),
        changePercent: finiteOrNull(changePercent(quote)),
        tradeVolume: finiteOrNull(quote.tradeVolume),
        tradeValue: finiteOrNull(quote.tradeValue),
        tradeDate: quote.tradeDate,
        hasOfficialQuote: quote.status !== 'invalid',
        hasHistory: historySet.has(quote.symbol),
        hasTechnical: Boolean(technicalEntry && technicalEntry.technicalScore !== null),
        hasDecision: decisionComplete || finiteOrNull(screenerEntry?.decisionScore) !== null,
        hasSnapshot: Boolean(snapshot),
        decisionScore: finiteOrNull(screenerEntry?.decisionScore),
        technicalScore: finiteOrNull(technicalEntry?.technicalScore ?? screenerEntry?.technicalScore),
        healthScore: finiteOrNull(screenerEntry?.healthScore),
        snapshotScore: finiteOrNull(snapshot?.snapshotScore ?? screenerEntry?.snapshotScore),
      }
    })
    const updatedAt = latestIso([stocks[0]?.fetchedAt, mapping.fetchedAt, technical?.generatedAt, screener?.generatedAt, snapshots?.generatedAt, decisionSummary?.generatedAt])
    return {
      records,
      coverage: calculateSearchCoverage({
        totalStocks: stocks.length,
        officialStocks: records.filter((item) => item.hasOfficialQuote).length,
        historyStocks: records.filter((item) => item.hasHistory).length,
        technicalStocks: records.filter((item) => item.hasTechnical).length,
        decisionStocks: decisionSummary?.stockCount ?? records.filter((item) => item.hasDecision).length,
        snapshotStocks: snapshots?.recordCount ?? records.filter((item) => item.hasSnapshot).length,
        updatedAt,
      }),
      builtAt: new Date().toISOString(),
      tradeDate: stocks[0]?.tradeDate ?? null,
    }
  }

  getIndexData(force = false) {
    if (force) this.clearCache()
    this.indexPromise ??= this.buildIndex().catch((error) => { this.indexPromise = null; throw error })
    return this.indexPromise
  }

  async getCoverage(force = false) { return (await this.getIndexData(force)).coverage }

  getPreview(stock: SearchStockIndexItem, force = false): Promise<StockSearchPreview> {
    if (force) this.previewCache.delete(stock.symbol)
    const cached = this.previewCache.get(stock.symbol)
    if (cached) return cached
    const request = this.buildPreview(stock).catch((error) => { this.previewCache.delete(stock.symbol); throw error })
    this.previewCache.set(stock.symbol, request)
    return request
  }

  private async buildPreview(stock: SearchStockIndexItem): Promise<StockSearchPreview> {
    const [decisionResult, snapshotResult] = await Promise.allSettled([
      this.dependencies.getDecision(stock.symbol),
      this.dependencies.getSnapshot(stock.symbol),
    ])
    const decision = decisionResult.status === 'fulfilled' ? decisionResult.value : null
    const snapshot = snapshotResult.status === 'fulfilled' ? snapshotResult.value : null
    const mockStocks = this.dependencies.getMockStocks()
    const mockStock = mockStocks.find((item) => item.symbol === stock.symbol)
    const healthScore = stock.healthScore ?? (mockStock ? calculateStockHealth(mockStock, mockStocks).totalScore : null)
    const warnings = [
      ...(decision?.warnings ?? []),
      ...(snapshot?.warnings ?? []),
      ...(decisionResult.status === 'rejected' ? ['Decision 尚未完成。'] : []),
      ...(snapshotResult.status === 'rejected' ? ['Snapshot 尚未完成。'] : []),
    ]
    return {
      stock,
      decision: scoreStatus(decision?.score ?? stock.decisionScore, stock.hasDecision),
      technical: scoreStatus(stock.technicalScore, stock.hasTechnical),
      health: scoreStatus(healthScore, stock.hasHistory),
      snapshot: scoreStatus(snapshot?.snapshotScore ?? stock.snapshotScore, stock.hasSnapshot),
      officialData: availability(stock.hasOfficialQuote, false),
      history: availability(stock.hasHistory),
      volume: stock.tradeVolume,
      warnings: [...new Set(warnings)],
    }
  }

  clearCache() {
    this.indexPromise = null
    this.previewCache.clear()
  }
}
