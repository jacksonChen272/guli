import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Factory,
  RefreshCw,
  SearchCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardSummaryItem } from '../../services/dashboard/TodaySummaryService'
import { getOperationEnvironment, type TodayMarketNarrative } from '../../services/dashboard/TodayMarketNarrativeService'
import { buildMarketScoreViewModel } from '../../services/dashboard/MarketScoreViewModel'
import type { DecisionResult } from '../../types/decision'
import type { MarketSentimentResult } from '../../types/dashboardIntelligence'
import type { OfficialMarketOverview } from '../../types/marketData'
import type { InstitutionalMarketTotals } from '../../types/officialInstitutionalData'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { DashboardCard } from './DashboardCard'
import { DashboardCountUpValue } from './DashboardCountUpValue'
import { DashboardDataState } from './DashboardDataState'
import { MarketSentimentVisual } from './MarketSentimentVisual'

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const formatNumber = (value: number | null | undefined, digits = 0) =>
  finite(value)
    ? value.toLocaleString('zh-TW', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : '尚未取得'

const formatSigned = (value: number | null | undefined, suffix = '') =>
  finite(value) ? `${value > 0 ? '+' : ''}${formatNumber(value, 2)}${suffix}` : '尚未取得'

const formatAmountValue = (value: number) =>
  `${(value / 100_000_000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 億元`

const formatAmount = (value: number | null | undefined) =>
  finite(value) ? formatAmountValue(value) : '尚未取得'

const trendEnglish = (stance: TodayMarketNarrative['stance']) => {
  if (stance === 'bullish') return 'Bullish'
  if (stance === 'bearish') return 'Bearish'
  if (stance === 'neutral') return 'Neutral'
  return 'Pending'
}

export function MarketCommandCenter({
  market,
  sentiment,
  decision,
  institutions,
  narrative,
  summaryItems,
  loading,
  error,
  onRetry,
}: {
  market: OfficialMarketOverview | null
  sentiment: MarketSentimentResult
  decision: DecisionResult | null
  institutions: InstitutionalMarketTotals | null
  narrative: TodayMarketNarrative
  summaryItems: DashboardSummaryItem[]
  loading: boolean
  error?: string | null
  onRetry?: () => void
}) {
  const model = buildMarketScoreViewModel({ decision, sentiment, market })
  const stale = Boolean(market && market.status !== 'official')
  const state = loading && !market
    ? 'loading'
    : error && !market
      ? 'error'
      : !market
        ? 'empty'
        : stale
          ? 'stale'
          : 'ready'
  const previous = market?.tradingHistory.at(-2) ?? null
  const operationEnvironment = getOperationEnvironment(narrative.stance).slice(0, 3)
  const directionTone = narrative.stance === 'bullish' ? 'up' : narrative.stance === 'bearish' ? 'down' : 'neutral'

  return (
    <DashboardCard
      data-testid="market-command-center"
      className="dashboard-command-center"
      title="Market Overview"
      eyebrow="TODAY'S MARKET"
      subtitle="今日市場方向、情緒與廣度的盤後重點"
      stale={stale}
      state={state}
      action={(
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone={market?.status === 'official' ? 'info' : 'warning'}>
            {market?.status === 'official' ? 'TWSE Official' : market?.status ?? 'Missing'}
          </Badge>
          {onRetry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              icon={<RefreshCw size={15} strokeWidth={1.8} />}
              aria-label="重新讀取 Dashboard 資料"
            >
              重新讀取
            </Button>
          )}
        </div>
      )}
    >
      <DashboardDataState
        loading={loading && !market}
        error={error && !market ? error : null}
        empty={!loading && !market}
        onRetry={onRetry}
        skeleton="metrics"
        emptyTitle="目前沒有市場總覽資料"
        emptyDescription="請確認 TWSE 靜態資料已產生，或稍後重新讀取。"
      >
        <div className="grid min-w-0 gap-5 p-4 sm:p-5 lg:grid-cols-12 lg:gap-6">
          <div className="min-w-0 lg:col-span-7">
            <div className="market-overview-signals grid gap-2 sm:grid-cols-3" aria-label="市場方向、情緒與廣度">
              <SignalItem
                label="Trend"
                value={trendEnglish(narrative.stance)}
                detail={model.trend.label}
                tone={directionTone}
                accessibleLabel={`趨勢方向：${model.trend.label}`}
              />
              <SignalItem
                label="Sentiment"
                value={finite(model.sentiment.score) ? model.sentiment.score.toFixed(1) : '—'}
                detail={model.sentiment.label}
                tone={model.sentiment.score !== null && model.sentiment.score >= 60 ? 'up' : model.sentiment.score !== null && model.sentiment.score < 40 ? 'down' : 'neutral'}
                accessibleLabel={`市場情緒：${model.sentiment.label}`}
              />
              <SignalItem
                label="Breadth"
                value={finite(model.breadth.advanceRatio) ? `${model.breadth.advanceRatio.toFixed(1)}%` : '—'}
                detail={model.breadth.label}
                tone={model.breadth.label === '偏多' ? 'up' : model.breadth.label === '偏空' ? 'down' : 'neutral'}
                accessibleLabel={`市場廣度：${model.breadth.label}`}
              />
            </div>

            <div className="mt-4">
              <Badge tone={directionTone}>{trendEnglish(narrative.stance)} · {model.trend.label}</Badge>
              <h3 className="mt-3 text-xl font-semibold leading-8 text-white sm:text-2xl">{narrative.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{narrative.summary}</p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="dashboard-label">Market Highlights</p>
                <p className="mt-0.5 text-xs text-slate-500">今日重點</p>
              </div>
              <span className="dashboard-updated">資料日 {market?.tradeDate ?? narrative.tradeDate ?? '尚未取得'}</span>
            </div>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3" aria-label="今日市場摘要">
              {summaryItems.slice(0, 3).map((item) => (
                <li key={item.id} className="market-highlight-item min-w-0">
                  <HighlightIcon tone={item.tone} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>

            <details className="group mt-3 rounded-xl border border-white/[.06] bg-white/[.015]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60">
                <Sparkles size={15} strokeWidth={1.8} className="text-brand-300" aria-hidden="true" />
                為什麼？
                <ChevronDown size={15} strokeWidth={1.8} className="ml-auto transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="grid gap-3 border-t border-white/[.06] p-3 text-xs leading-5 sm:grid-cols-3">
                <ReasonList title="正向依據" items={narrative.positiveFactors} />
                <ReasonList title="負向依據" items={narrative.negativeFactors} />
                <ReasonList title="主要風險" items={narrative.riskNotes} />
                <p className="sm:col-span-3 text-slate-600">
                  趨勢方向來自既有 Decision；市場情緒使用 {sentiment.formulaVersion}；市場廣度取自 TWSE 家數統計。三者意義不同，不互相替代。
                </p>
              </div>
            </details>

            <div className="market-command-footer mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2" aria-label="今日操作環境">
                {operationEnvironment.map((item) => (
                  <span key={item} className="rounded-lg bg-white/[.025] px-2.5 py-1.5 text-[11px] text-slate-500">{item}</span>
                ))}
              </div>

              <nav className="market-command-actions flex flex-wrap gap-2" aria-label="市場快速操作">
                <Link className="dashboard-cta dashboard-cta--primary" to="/decisions">
                  <BarChart3 size={16} strokeWidth={1.8} aria-hidden="true" />
                  查看市場分析
                </Link>
                <Link className="dashboard-cta" to="/industries">
                  <Factory size={16} strokeWidth={1.8} aria-hidden="true" />
                  產業分析
                </Link>
                <Link className="dashboard-cta" to="/screener">
                  <SearchCheck size={16} strokeWidth={1.8} aria-hidden="true" />
                  快速選股
                </Link>
              </nav>
            </div>
          </div>

          <div className="grid min-w-0 content-start gap-2.5 lg:col-span-5">
            <div className="market-index-card rounded-2xl border border-brand-400/15 bg-brand-400/[.04] p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="dashboard-label">{market?.indexName ?? '加權指數'}</p>
                  <DashboardCountUpValue
                    value={market?.indexValue}
                    formatter={(next) => formatNumber(next, 2)}
                    className="dashboard-metric-primary mt-1 block truncate font-semibold text-white"
                  />
                  <p className={`mt-1.5 flex items-center gap-1.5 text-sm ${market && market.change > 0 ? 'text-red-300' : market && market.change < 0 ? 'text-emerald-300' : 'text-slate-300'}`}>
                    <DirectionIcon value={market?.change} />
                    <span className="mono tabular-nums">{formatSigned(market?.change, ' 點')} · {formatSigned(market?.changePercent, '%')}</span>
                    <span className="sr-only">{market && market.change > 0 ? '上漲' : market && market.change < 0 ? '下跌' : '平盤'}</span>
                  </p>
                </div>
                <MiniMarketSparkline values={market?.tradingHistory.map((point) => point.indexValue) ?? []} />
              </div>
              <p className="dashboard-updated mt-2 flex items-center gap-1.5">
                <CalendarDays size={13} strokeWidth={1.8} aria-hidden="true" />
                前一交易日 {previous ? formatNumber(previous.indexValue, 2) : '尚未取得'} · {market?.tradeDate ?? '尚未取得'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Metric
                label="成交值"
                value={market?.tradingAmount}
                formatter={formatAmountValue}
                fallback={formatAmount(market?.tradingAmount)}
                detail={previous ? `前日 ${formatAmount(previous.tradingAmount)}` : undefined}
              />
              <Metric
                label="外資買賣超"
                value={institutions?.foreign.netAmount}
                formatter={formatAmountValue}
                fallback={formatAmount(institutions?.foreign.netAmount)}
                tone={institutions?.foreign.netAmount}
                detail="TWSE 官方盤後"
              />
            </div>
            <MarketSentimentVisual sentiment={model.sentiment} />
          </div>
        </div>
      </DashboardDataState>
    </DashboardCard>
  )
}

function SignalItem({
  label,
  value,
  detail,
  tone,
  accessibleLabel,
}: {
  label: string
  value: string
  detail: string
  tone: 'up' | 'down' | 'neutral'
  accessibleLabel: string
}) {
  return (
    <div className="market-overview-signal" aria-label={accessibleLabel}>
      <p className="dashboard-label">{label}</p>
      <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
        <strong className="truncate text-sm font-semibold text-white">{value}</strong>
        <Badge tone={tone}>{detail}</Badge>
      </div>
    </div>
  )
}

function HighlightIcon({ tone }: { tone: DashboardSummaryItem['tone'] }) {
  const Icon = tone === 'positive' ? TrendingUp : tone === 'warning' ? TrendingDown : CircleDot
  const className = tone === 'positive'
    ? 'text-red-300'
    : tone === 'warning'
      ? 'text-amber-300'
      : 'text-blue-300'
  return (
    <span className={`market-highlight-icon ${className}`} aria-hidden="true">
      <Icon size={15} strokeWidth={1.8} />
    </span>
  )
}

function DirectionIcon({ value }: { value: number | null | undefined }) {
  if (!finite(value) || value === 0) return <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
  return value > 0
    ? <ArrowUp size={15} strokeWidth={1.8} aria-hidden="true" />
    : <ArrowDown size={15} strokeWidth={1.8} aria-hidden="true" />
}

function Metric({
  label,
  value,
  formatter,
  fallback,
  detail,
  tone,
}: {
  label: string
  value: number | null | undefined
  formatter: (value: number) => string
  fallback: string
  detail?: string
  tone?: number | null
}) {
  return (
    <div className="market-metric-card min-w-0 rounded-2xl border border-white/[.06] bg-black/10 p-3">
      <p className="dashboard-label">{label}</p>
      {finite(value)
        ? (
          <DashboardCountUpValue
            value={value}
            formatter={formatter}
            className={`mt-1 block truncate text-right text-base font-semibold ${finite(tone) && tone > 0 ? 'text-red-300' : finite(tone) && tone < 0 ? 'text-emerald-300' : 'text-white'}`}
          />
        )
        : <p className="mt-1 truncate text-right text-base font-semibold text-slate-500" title={fallback}>{fallback}</p>}
      {detail && <p className="dashboard-updated mt-1 truncate text-right" title={detail}>{detail}</p>}
    </div>
  )
}

function ReasonList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="min-w-0">
      <p className="font-medium text-slate-300">{title}</p>
      {items.length
        ? <ul className="mt-1 space-y-1 text-slate-500">{items.slice(0, 3).map((item) => <li key={item}>• {item}</li>)}</ul>
        : <p className="mt-1 text-slate-600">目前沒有可用依據</p>}
    </div>
  )
}

function MiniMarketSparkline({ values }: { values: number[] }) {
  const finiteValues = values.filter(Number.isFinite).slice(-20)
  if (finiteValues.length < 2) return <span className="dashboard-updated">趨勢資料不足</span>
  const min = Math.min(...finiteValues)
  const max = Math.max(...finiteValues)
  const range = max - min || 1
  const points = finiteValues.map((value, index) => `${index / (finiteValues.length - 1) * 92 + 2},${34 - (value - min) / range * 28}`).join(' ')
  const up = finiteValues.at(-1)! >= finiteValues[0]
  return (
    <svg className="h-11 w-24 shrink-0" viewBox="0 0 96 40" role="img" aria-label={`近 ${finiteValues.length} 日指數趨勢${up ? '向上' : '向下'}`}>
      <polyline points={points} fill="none" stroke={up ? '#f87171' : '#34d399'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
