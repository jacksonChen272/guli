import { Activity, Building2, Flame, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HotStockItem } from '../../types/dashboardIntelligence'
import type { InstitutionalDatasetStatus, OfficialStockInstitutionalRecord } from '../../types/officialInstitutionalData'
import type { ScreenerDataset, ScreenerResult } from '../../types/screener'
import { Badge } from '../ui/Badge'
import { DashboardCard } from './DashboardCard'
import { DashboardSkeleton } from './DashboardSkeleton'

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const number = (value: number | null | undefined, digits = 1) =>
  finite(value) ? value.toLocaleString('zh-TW', { maximumFractionDigits: digits }) : '尚未取得'

export function selectTechnicalOpportunities(dataset: ScreenerDataset | null, limit = 5): ScreenerResult[] {
  if (!dataset) return []
  const seen = new Set<string>()
  return [...dataset.results]
    .filter((result) => result.matched && result.technicalScore !== null)
    .sort((left, right) => left.rank - right.rank || (right.technicalScore ?? -1) - (left.technicalScore ?? -1))
    .filter((result) => {
      if (seen.has(result.symbol)) return false
      seen.add(result.symbol)
      return true
    })
    .slice(0, limit)
}

export function TodayOpportunitiesSection({
  hotStocks,
  screener,
  institutional,
  institutionStatus,
  loading,
}: {
  hotStocks: HotStockItem[]
  screener: ScreenerDataset | null
  institutional: OfficialStockInstitutionalRecord[]
  institutionStatus: InstitutionalDatasetStatus | null
  loading: boolean
}) {
  const technical = selectTechnicalOpportunities(screener)
  const stale = Boolean(screener?.warnings.length || institutionStatus?.stale)

  return (
    <section className="min-w-0" aria-labelledby="today-opportunities-title" data-testid="today-opportunities-section">
      <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">TODAY OPPORTUNITIES</p>
          <h2 id="today-opportunities-title" className="mt-1 text-xl font-semibold text-white">今日機會雷達</h2>
          <p className="mt-1 text-sm text-slate-500">沿用既有熱門排行、技術選股與官方法人買超結果，不新增評分公式。</p>
        </div>
        <Badge tone={stale ? 'warning' : 'neutral'}>{stale ? '部分資料較舊' : '依現有資料排序'}</Badge>
      </div>
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <OpportunityColumn title="市場熱門" icon={<Flame size={17} />} updatedAt={hotStocks[0]?.tradeDate}>
          {loading && !hotStocks.length
            ? <DashboardSkeleton rows={4} />
            : hotStocks.length
              ? hotStocks.slice(0, 5).map((item) => (
                <OpportunityRow
                  key={item.symbol}
                  symbol={item.symbol}
                  name={item.name}
                  metric={`熱門 ${number(item.hotScore, 0)} 分`}
                  reason={item.reasons[0] ?? '依成交值、成交量與漲跌幅排序'}
                  date={item.tradeDate}
                />
              ))
              : <ColumnEmpty text="尚無熱門股票排行" />}
        </OpportunityColumn>

        <OpportunityColumn title="技術機會" icon={<Activity size={17} />} updatedAt={screener?.tradeDate}>
          {loading && !screener
            ? <DashboardSkeleton rows={4} />
            : technical.length
              ? technical.map((item) => (
                <OpportunityRow
                  key={item.symbol}
                  symbol={item.symbol}
                  name={item.name}
                  metric={`Technical ${number(item.technicalScore, 0)}`}
                  reason={item.reasons[0] ?? item.matchedRules[0] ?? '符合既有技術選股條件'}
                  date={item.tradeDate}
                  stale={item.stale}
                />
              ))
              : <ColumnEmpty text="目前沒有符合條件的技術機會" />}
        </OpportunityColumn>

        <OpportunityColumn className="md:col-span-2 xl:col-span-1" title="法人關注" icon={<Building2 size={17} />} updatedAt={institutionStatus?.tradeDate}>
          {loading && !institutionStatus
            ? <DashboardSkeleton rows={4} />
            : institutional.length
              ? institutional.slice(0, 5).map((item) => (
                <OpportunityRow
                  key={item.symbol}
                  symbol={item.symbol}
                  name={item.name}
                  metric={`合計 +${number(item.totalNetShares, 0)} 股`}
                  reason="三大法人合計買超排行"
                  date={item.tradeDate}
                  stale={institutionStatus?.stale}
                />
              ))
              : <ColumnEmpty text="尚未取得官方法人排行" />}
        </OpportunityColumn>
      </div>
    </section>
  )
}

function OpportunityColumn({
  title,
  icon,
  updatedAt,
  className = '',
  children,
}: {
  title: string
  icon: React.ReactNode
  updatedAt?: string | null
  className?: string
  children: React.ReactNode
}) {
  return (
    <DashboardCard
      title={title}
      eyebrow="TOP 5"
      updatedAt={updatedAt}
      className={className}
      action={<span className="grid h-9 w-9 place-items-center rounded-lg border border-white/[.06] text-brand-300">{icon}</span>}
    >
      <div className="divide-y divide-white/[.05] px-3 py-1">{children}</div>
    </DashboardCard>
  )
}

function OpportunityRow({
  symbol,
  name,
  metric,
  reason,
  date,
  stale = false,
}: {
  symbol: string
  name: string
  metric: string
  reason: string
  date: string
  stale?: boolean
}) {
  return (
    <Link
      to={`/stock/${symbol}`}
      className="group flex min-h-16 min-w-0 items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
      aria-label={`查看 ${symbol} ${name} 個股分析`}
    >
      <span className="mono shrink-0 text-xs text-slate-500">{symbol}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-200 group-hover:text-white">{name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-600" title={reason}>{reason}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-xs text-brand-300">{metric}</span>
        <span className="mt-0.5 block text-[10px] text-slate-600">{stale ? '較舊 · ' : ''}{date}</span>
      </span>
    </Link>
  )
}

function ColumnEmpty({ text }: { text: string }) {
  return <p className="flex min-h-40 items-center justify-center gap-2 px-3 text-center text-sm text-slate-500"><Inbox size={16} aria-hidden="true" />{text}</p>
}
