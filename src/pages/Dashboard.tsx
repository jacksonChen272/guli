import { AlertTriangle, CalendarDays, Clock3, LayoutDashboard, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { DashboardWidgetLayout } from '../components/dashboard/DashboardWidgetLayout'
import { DataCoverageSummary } from '../components/dashboard/DataCoverageSummary'
import { HotStocksCard } from '../components/dashboard/HotStocksCard'
import { MarketBreadthCard } from '../components/dashboard/MarketBreadthCard'
import { MarketCommandCenter } from '../components/dashboard/MarketCommandCenter'
import { MarketHeatmapSection } from '../components/dashboard/MarketHeatmapSection'
import { MarketRanking } from '../components/dashboard/MarketRanking'
import { RecentSearchCard } from '../components/dashboard/RecentSearchCard'
import { TechnicalScreenerPreview } from '../components/dashboard/TechnicalScreenerPreview'
import { TodayEventsCard } from '../components/dashboard/TodayEventsCard'
import { TodayOpportunitiesSection } from '../components/dashboard/TodayOpportunitiesSection'
import { TodayRecommendations } from '../components/dashboard/TodayRecommendations'
import { WatchlistPreview } from '../components/dashboard/WatchlistPreview'
import { IndustryRotationPreview } from '../components/industry/IndustryRotationPreview'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { useTodayDashboardData } from '../hooks/useTodayDashboardData'
import { formatDate, formatDateTime } from '../lib/formatters'
import type { DashboardWidgetId } from '../types/dashboardIntelligence'

const FIXED_WIDGETS: DashboardWidgetId[] = ['hero', 'sentiment', 'summary', 'heatmap']

export function Dashboard() {
  const { data, loading, error, reload } = useTodayDashboardData()
  const dataStatus = !data.platform
    ? 'Partial'
    : data.platform.allCoreOfficial && data.platform.industry === 'Official'
      ? 'Official'
      : data.platform.market === 'Official' && data.platform.stocks !== 'Missing' && data.platform.institutions !== 'Missing'
        ? 'Mixed'
        : 'Partial'
  const dataStatusTone = dataStatus === 'Official' ? 'info' : dataStatus === 'Mixed' ? 'brand' : 'warning'

  const renderWidget = (id: DashboardWidgetId): ReactNode => {
    if (id === 'hot-stocks') return <HotStocksCard stocks={data.hotStocks} loading={loading} />
    if (id === 'recent-search') return <RecentSearchCard symbols={data.recentSearches} />
    if (id === 'watchlist') return <WatchlistPreview items={data.watchlist} loading={loading} />
    if (id === 'recommendations') return <TodayRecommendations dataset={data.screener} loading={loading} />
    if (id === 'industry-rotation') return <IndustryRotationPreview snapshot={data.industries} loading={loading} />
    if (id === 'technical-opportunities') return <TechnicalScreenerPreview dataset={data.screener} loading={loading} />
    if (id === 'twse-rankings') return <section aria-label="TWSE 市場排行"><MarketRanking data={data.market ?? undefined} /></section>
    if (id === 'today-events') return <TodayEventsCard />
    if (id === 'data-coverage') return <DataCoverageSummary coverage={data.coverage} platform={data.platform} loading={loading} />
    return null
  }

  return (
    <div className="dashboard-alpha2 dashboard-alpha3 min-w-0 space-y-6 page-enter" data-testid="today-dashboard" data-dashboard-version="dashboard-3.0-alpha.3">
      <header className="dashboard-page-header flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" aria-labelledby="dashboard-title">
        <div className="min-w-0">
          <nav aria-label="麵包屑">
            <ol className="flex items-center gap-2 text-xs text-slate-600">
              <li>Dashboard</li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-400" aria-current="page">市場總覽</li>
            </ol>
          </nav>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="brand">Dashboard 3.0 Alpha</Badge>
            <Badge tone={dataStatusTone}>{dataStatus}</Badge>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="dashboard-header-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[.07] text-brand-300">
              <LayoutDashboard size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">TODAY DASHBOARD</p>
              <h1 id="dashboard-title" className="mt-0.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">今日市場總覽</h1>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-500">依序掌握市場方向、情緒、廣度與資金焦點，再檢視今日機會。</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:flex sm:flex-wrap sm:justify-end" aria-label="Dashboard 資料時間">
          <span className="dashboard-header-meta flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-white/[.06] bg-white/[.02] px-3">
            <CalendarDays size={14} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
            <span className="truncate">資料日 {formatDate(data.market?.tradeDate)}</span>
          </span>
          <span className="dashboard-header-meta flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-white/[.06] bg-white/[.02] px-3">
            <Clock3 size={14} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
            <span className="truncate">更新 {formatDateTime(data.market?.fetchedAt ?? data.platform?.updatedAt)}</span>
          </span>
          <span className="dashboard-header-meta col-span-2 flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-white/[.06] bg-white/[.02] px-3 sm:col-span-1">
            <ShieldCheck size={14} strokeWidth={1.8} className="shrink-0 text-brand-300" aria-hidden="true" />
            <span className="truncate">{data.market?.status === 'official' ? 'TWSE 官方盤後' : '資料狀態待確認'}</span>
          </span>
        </div>
      </header>

      <MarketCommandCenter
        market={data.market}
        sentiment={data.sentiment}
        decision={data.marketDecision}
        institutions={data.institutionTotals}
        narrative={data.narrative}
        summaryItems={data.commandSummary}
        loading={loading}
        error={error}
        onRetry={() => void reload()}
      />

      <section className="dashboard-breadth-heatmap grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-12" aria-label="市場廣度與熱力圖">
        <MarketBreadthCard
          className="xl:col-span-4"
          market={data.market}
          heatmap={data.heatmap}
          loading={loading}
          error={data.market || data.heatmap ? null : data.heatmapError ?? error}
          onRetry={() => void reload()}
        />
        <MarketHeatmapSection
          className="xl:col-span-8"
          dataset={data.heatmap}
          loading={loading}
          error={data.heatmapError}
          onRetry={() => void reload()}
        />
      </section>

      <TodayOpportunitiesSection
        hotStocks={data.hotStocks}
        screener={data.screener}
        institutional={data.institutionalTopBuy}
        institutionStatus={data.institutionStatus}
        loading={loading}
      />

      {error && data.market && (
        <Card state="error" variant="compact">
          <p className="flex items-start gap-2 px-5 py-4 text-sm leading-6 text-amber-200">
            <AlertTriangle className="mt-1 shrink-0" size={16} strokeWidth={1.8} aria-hidden="true" />
            {error}；目前仍顯示可用資料，請稍後重試。
          </p>
        </Card>
      )}

      <section className="min-w-0 space-y-4" aria-labelledby="other-widgets-title">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2 id="other-widgets-title" className="mt-1 text-xl font-semibold text-white">其他市場工具</h2>
          <p className="mt-1 text-sm text-slate-500">依你的工作習慣拖曳下方卡片；既有 LocalStorage 排列會完整保留。</p>
        </div>
        <DashboardWidgetLayout renderWidget={renderWidget} excludedIds={FIXED_WIDGETS} />
      </section>
    </div>
  )
}
