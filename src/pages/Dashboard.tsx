import { lazy, Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'
import { DataCoverageSummary } from '../components/dashboard/DataCoverageSummary'
import { MarketNewsPlaceholder } from '../components/dashboard/MarketNewsPlaceholder'
import { MarketRanking } from '../components/dashboard/MarketRanking'
import { TechnicalScreenerPreview } from '../components/dashboard/TechnicalScreenerPreview'
import { TodayMarketHero } from '../components/dashboard/TodayMarketHero'
import { TodayRecommendations } from '../components/dashboard/TodayRecommendations'
import { IndustryRotationPreview } from '../components/industry/IndustryRotationPreview'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import { useTodayDashboardData } from '../hooks/useTodayDashboardData'
import { repositoryHub } from '../repositories/RepositoryHub'

const MarketHeatmap = lazy(() => import('../components/dashboard/MarketHeatmap').then((module) => ({ default: module.MarketHeatmap })))

export function Dashboard() {
  const { data, loading, error } = useTodayDashboardData()
  const officialMarket = repositoryHub.getSnapshot().overview.officialMarket

  return <div className="min-w-0 space-y-7 lg:space-y-9" data-testid="today-dashboard">
    <TodayMarketHero market={officialMarket} decision={data.marketDecision} institutions={data.institutionTotals} narrative={data.narrative} loading={loading}/>
    {error && <Card state="error" variant="compact"><p className="flex items-start gap-2 px-5 py-4 text-sm leading-6 text-amber-200"><AlertTriangle className="mt-1 shrink-0" size={16}/>{error}；已取得的市場資訊仍會正常顯示。</p></Card>}
    <TodayRecommendations dataset={data.screener} loading={loading}/>
    <Suspense fallback={<Card><LoadingState rows={5}/></Card>}><MarketHeatmap dataset={data.heatmap} loading={loading} error={data.heatmapError}/></Suspense>
    <IndustryRotationPreview snapshot={data.industries} loading={loading}/>
    <TechnicalScreenerPreview dataset={data.screener} loading={loading}/>
    <section aria-label="市場排行榜"><MarketRanking data={officialMarket}/></section>
    <MarketNewsPlaceholder/>
    <DataCoverageSummary coverage={data.coverage} platform={data.platform} loading={loading}/>
  </div>
}
