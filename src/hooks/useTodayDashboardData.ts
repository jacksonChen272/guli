import { useCallback, useEffect, useState } from 'react'
import { repositoryHub } from '../repositories/RepositoryHub'
import { generateTodayMarketNarrative, type TodayMarketNarrative } from '../services/dashboard/TodayMarketNarrativeService'
import type { DataPlatformStatus } from '../types/dataPlatformStatus'
import type { DecisionResult } from '../types/decision'
import type { IndustrySnapshot } from '../types/industrySnapshot'
import type { MarketHeatmapDataset } from '../types/marketHeatmap'
import type { InstitutionalMarketTotals } from '../types/officialInstitutionalData'
import type { ScreenerDataset } from '../types/screener'
import type { HotStockItem, MarketSentimentResult, TodaySummaryResult, WatchlistPreviewItem } from '../types/dashboardIntelligence'
import { generateTodaySummary } from '../services/dashboard/TodaySummaryService'
import { calculateMarketSentiment } from '../services/dashboard/MarketSentimentService'

export interface TodayCoverage {
  totalCommonStocks: number
  officialStockCount: number
  institutionalStockCount: number
  historyStockCount: number
  technicalStockCount: number
  industryMappedCount: number
  industryUnmappedCount: number
  industryCount: number
  industryCoverageRate: number
  industryMappingUpdatedAt: string | null
  updatedAt: string | null
}

export interface TodayDashboardData {
  marketDecision: DecisionResult | null
  institutionTotals: InstitutionalMarketTotals | null
  screener: ScreenerDataset | null
  industries: IndustrySnapshot | null
  platform: DataPlatformStatus | null
  coverage: TodayCoverage
  heatmap: MarketHeatmapDataset | null
  heatmapError: string | null
  narrative: TodayMarketNarrative
  sentiment: MarketSentimentResult
  todaySummary: TodaySummaryResult
  hotStocks: HotStockItem[]
  recentSearches: string[]
  watchlist: WatchlistPreviewItem[]
}

const emptyCoverage: TodayCoverage = {
  totalCommonStocks: 0,
  officialStockCount: 0,
  institutionalStockCount: 0,
  historyStockCount: 0,
  technicalStockCount: 0,
  industryMappedCount: 0,
  industryUnmappedCount: 0,
  industryCount: 0,
  industryCoverageRate: 0,
  industryMappingUpdatedAt: null,
  updatedAt: null,
}

const emptyData: TodayDashboardData = {
  marketDecision: null,
  institutionTotals: null,
  screener: null,
  industries: null,
  platform: null,
  coverage: emptyCoverage,
  heatmap: null,
  heatmapError: null,
  narrative: generateTodayMarketNarrative({ market: null, decision: null, institutions: null, industries: null, screener: null }),
  sentiment: calculateMarketSentiment({ market: null, institutions: null, decision: null }),
  todaySummary: generateTodaySummary({ sentiment: calculateMarketSentiment({ market: null, institutions: null, decision: null }), market: null, institutions: null }),
  hotStocks: [],
  recentSearches: [],
  watchlist: [],
}

export function useTodayDashboardData() {
  const [data, setData] = useState<TodayDashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let heatmapError: string | null = null
    const [marketDecision, institutionTotals, screener, industries, platform, stocks, history, institutionStatus, heatmap, industryMapping, sentiment, hotStocks, watchlist] = await Promise.all([
      repositoryHub.decisions.getMarketDecision().catch(() => null),
      repositoryHub.institutions.getMarketTotals().catch(() => null),
      repositoryHub.screener.getDataset().catch(() => null),
      repositoryHub.industrySnapshots.getLatest().catch(() => null),
      repositoryHub.getPlatformDataStatus().catch(() => null),
      repositoryHub.stocks.getOfficialStocks().catch(() => []),
      repositoryHub.stockHistory.getDatasetStatus().catch(() => null),
      repositoryHub.institutions.getDatasetStatus().catch(() => null),
      repositoryHub.marketHeatmap.getLatest().catch((reason: unknown) => {
        heatmapError = reason instanceof Error ? reason.message : '市場熱力圖資料暫時無法讀取。'
        return null
      }),
      repositoryHub.industryMapping.getStatus(),
      repositoryHub.marketSentiment.getLatest().catch(() => calculateMarketSentiment({ market: null, institutions: null, decision: null })),
      repositoryHub.hotStocks.getTop(5).catch(() => []),
      repositoryHub.watchlist.getPreview(5).catch(() => []),
    ])

    const commonStocks = stocks.filter((stock) => /^\d{4}$/.test(stock.symbol) && stock.instrumentType === 'stock')
    const market = repositoryHub.getSnapshot().overview.officialMarket ?? null
    setData({
      marketDecision,
      institutionTotals,
      screener,
      industries,
      platform,
      heatmap,
      heatmapError,
      narrative: generateTodayMarketNarrative({ market, decision: marketDecision, institutions: institutionTotals, industries, screener }),
      sentiment,
      todaySummary: generateTodaySummary({ sentiment, market, institutions: institutionTotals }),
      hotStocks,
      recentSearches: repositoryHub.recentSearch.getRecent(10),
      watchlist,
      coverage: {
        totalCommonStocks: industryMapping.totalStocks || commonStocks.length,
        officialStockCount: commonStocks.length,
        institutionalStockCount: institutionStatus?.recordCount ?? 0,
        historyStockCount: history?.availableSymbols ?? 0,
        technicalStockCount: screener?.sampleCount ?? 0,
        industryMappedCount: industryMapping.mappedStocks,
        industryUnmappedCount: industryMapping.unmappedStocks,
        industryCount: industryMapping.industryCount,
        industryCoverageRate: industryMapping.coverageRate,
        industryMappingUpdatedAt: industryMapping.fetchedAt,
        updatedAt: heatmap?.generatedAt ?? history?.updatedAt ?? institutionStatus?.fetchedAt ?? platform?.updatedAt ?? null,
      },
    })
    if (!marketDecision && !screener && !industries) setError('今日分析資料暫時無法讀取')
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => repositoryHub.recentSearch.subscribe((recentSearches) => setData((current) => ({ ...current, recentSearches }))), [])
  return { data, loading, error, reload: load }
}
