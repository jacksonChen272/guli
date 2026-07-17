import { useCallback, useEffect, useState } from 'react'
import { repositoryHub } from '../repositories/RepositoryHub'
import { generateTodayMarketNarrative, type TodayMarketNarrative } from '../services/dashboard/TodayMarketNarrativeService'
import type { DataPlatformStatus } from '../types/dataPlatformStatus'
import type { DecisionResult } from '../types/decision'
import type { IndustrySnapshot } from '../types/industrySnapshot'
import type { MarketHeatmapDataset } from '../types/marketHeatmap'
import type { InstitutionalMarketTotals } from '../types/officialInstitutionalData'
import type { ScreenerDataset } from '../types/screener'

export interface TodayCoverage {
  totalCommonStocks: number
  officialStockCount: number
  institutionalStockCount: number
  historyStockCount: number
  technicalStockCount: number
  industryMappedCount: number
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
}

const emptyCoverage: TodayCoverage = {
  totalCommonStocks: 0,
  officialStockCount: 0,
  institutionalStockCount: 0,
  historyStockCount: 0,
  technicalStockCount: 0,
  industryMappedCount: 0,
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
}

export function useTodayDashboardData() {
  const [data, setData] = useState<TodayDashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let heatmapError: string | null = null
    const [marketDecision, institutionTotals, screener, industries, platform, stocks, history, institutionStatus, heatmap] = await Promise.all([
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
      coverage: {
        totalCommonStocks: commonStocks.length,
        officialStockCount: commonStocks.length,
        institutionalStockCount: institutionStatus?.recordCount ?? 0,
        historyStockCount: history?.availableSymbols ?? 0,
        technicalStockCount: screener?.sampleCount ?? 0,
        industryMappedCount: heatmap?.mappedStockCount ?? 0,
        updatedAt: heatmap?.generatedAt ?? history?.updatedAt ?? institutionStatus?.fetchedAt ?? platform?.updatedAt ?? null,
      },
    })
    if (!marketDecision && !screener && !industries) setError('今日分析資料暫時無法讀取')
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])
  return { data, loading, error, reload: load }
}
