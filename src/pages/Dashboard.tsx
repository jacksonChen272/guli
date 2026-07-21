import { lazy, Suspense, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { DashboardWidgetLayout } from '../components/dashboard/DashboardWidgetLayout'
import { DataCoverageSummary } from '../components/dashboard/DataCoverageSummary'
import { HotStocksCard } from '../components/dashboard/HotStocksCard'
import { MarketRanking } from '../components/dashboard/MarketRanking'
import { MarketSentimentGauge } from '../components/dashboard/MarketSentimentGauge'
import { RecentSearchCard } from '../components/dashboard/RecentSearchCard'
import { TechnicalScreenerPreview } from '../components/dashboard/TechnicalScreenerPreview'
import { TodayEventsCard } from '../components/dashboard/TodayEventsCard'
import { TodayMarketHero } from '../components/dashboard/TodayMarketHero'
import { TodayRecommendations } from '../components/dashboard/TodayRecommendations'
import { TodaySummaryCard } from '../components/dashboard/TodaySummaryCard'
import { WatchlistPreview } from '../components/dashboard/WatchlistPreview'
import { IndustryRotationPreview } from '../components/industry/IndustryRotationPreview'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import { useTodayDashboardData } from '../hooks/useTodayDashboardData'
import { repositoryHub } from '../repositories/RepositoryHub'
import type { DashboardWidgetId } from '../types/dashboardIntelligence'

const MarketHeatmap = lazy(() => import('../components/dashboard/MarketHeatmap').then((module) => ({ default: module.MarketHeatmap })))

export function Dashboard() {
  const { data, loading, error } = useTodayDashboardData()
  const officialMarket = repositoryHub.getSnapshot().overview.officialMarket
  const widget = (id: DashboardWidgetId): ReactNode => {
    if (id === 'hero') return <TodayMarketHero market={officialMarket} decision={data.marketDecision} institutions={data.institutionTotals} narrative={data.narrative} loading={loading}/>
    if (id === 'sentiment') return <MarketSentimentGauge result={data.sentiment} loading={loading}/>
    if (id === 'summary') return <TodaySummaryCard summary={data.todaySummary} loading={loading}/>
    if (id === 'hot-stocks') return <HotStocksCard stocks={data.hotStocks} loading={loading}/>
    if (id === 'recent-search') return <RecentSearchCard symbols={data.recentSearches}/>
    if (id === 'watchlist') return <WatchlistPreview items={data.watchlist} loading={loading}/>
    if (id === 'recommendations') return <TodayRecommendations dataset={data.screener} loading={loading}/>
    if (id === 'heatmap') return <Suspense fallback={<Card><LoadingState rows={5}/></Card>}><MarketHeatmap dataset={data.heatmap} loading={loading} error={data.heatmapError}/></Suspense>
    if (id === 'industry-rotation') return <IndustryRotationPreview snapshot={data.industries} loading={loading}/>
    if (id === 'technical-opportunities') return <TechnicalScreenerPreview dataset={data.screener} loading={loading}/>
    if (id === 'twse-rankings') return <section aria-label="TWSE 市場排行"><MarketRanking data={officialMarket}/></section>
    if (id === 'today-events') return <TodayEventsCard/>
    return <DataCoverageSummary coverage={data.coverage} platform={data.platform} loading={loading}/>
  }

  return <div className="min-w-0" data-testid="today-dashboard" data-dashboard-version="market-intelligence-v1">
    {error && <Card state="error" variant="compact" className="mb-5"><p className="flex items-start gap-2 px-5 py-4 text-sm leading-6 text-amber-200"><AlertTriangle className="mt-1 shrink-0" size={16}/>{error}，目前仍顯示可用區塊。</p></Card>}
    <DashboardWidgetLayout renderWidget={widget}/>
  </div>
}
