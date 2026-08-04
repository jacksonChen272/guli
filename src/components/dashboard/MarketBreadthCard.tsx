import { ArrowDown, ArrowUp, Gauge, Minus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { MarketHeatmapDataset } from '../../types/marketHeatmap'
import type { OfficialMarketOverview } from '../../types/marketData'
import { Badge } from '../ui/Badge'
import { DashboardCard } from './DashboardCard'
import { DashboardDataState } from './DashboardDataState'

export interface MarketBreadthModel {
  advance: number | null
  decline: number | null
  unchanged: number | null
  advancePercent: number
  declinePercent: number
  unchangedPercent: number
  gainAboveThree: number | null
  declineBelowThree: number | null
  limitUp: number | null
  limitDown: number | null
  label: '偏多' | '中性' | '偏空' | '資料不足'
  description: string
  total: number
}

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function buildMarketBreadthModel(
  market: OfficialMarketOverview | null,
  heatmap: MarketHeatmapDataset | null,
): MarketBreadthModel {
  const advance = finite(market?.advanceCount) ? market.advanceCount : null
  const decline = finite(market?.declineCount) ? market.declineCount : null
  const unchanged = finite(market?.unchangedCount) ? market.unchangedCount : null
  const total = (advance ?? 0) + (decline ?? 0) + (unchanged ?? 0)
  const advanceRatio = total > 0 && advance !== null ? advance / total * 100 : null
  const comparable = (heatmap?.stocks ?? []).filter(
    (stock): stock is typeof stock & { changePercent: number } => finite(stock.changePercent),
  )
  const gainAboveThree = comparable.length
    ? comparable.filter((stock) => stock.changePercent >= 3).length
    : null
  const declineBelowThree = comparable.length
    ? comparable.filter((stock) => stock.changePercent <= -3).length
    : null
  const label = advanceRatio === null
    ? '資料不足'
    : advanceRatio >= 55
      ? '偏多'
      : advanceRatio <= 40
        ? '偏空'
        : '中性'
  const description = label === '偏多'
    ? '上漲家數占比超過 55%，盤面廣度偏多。'
    : label === '偏空'
      ? '上漲家數占比不高於 40%，盤面廣度偏空。'
      : label === '中性'
        ? '漲跌家數分布接近均衡，盤面廣度中性。'
        : '漲跌家數不足，暫不判讀市場廣度。'

  return {
    advance,
    decline,
    unchanged,
    advancePercent: total ? (advance ?? 0) / total * 100 : 0,
    declinePercent: total ? (decline ?? 0) / total * 100 : 0,
    unchangedPercent: total ? (unchanged ?? 0) / total * 100 : 0,
    gainAboveThree,
    declineBelowThree,
    limitUp: finite(market?.limitUpCount) ? market.limitUpCount : null,
    limitDown: finite(market?.limitDownCount) ? market.limitDownCount : null,
    label,
    description,
    total,
  }
}

export function MarketBreadthCard({
  market,
  heatmap,
  loading,
  error,
  onRetry,
  className = '',
}: {
  market: OfficialMarketOverview | null
  heatmap: MarketHeatmapDataset | null
  loading: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}) {
  const [view, setView] = useState<'count' | 'percent'>('count')
  const model = buildMarketBreadthModel(market, heatmap)
  const stale = heatmap?.status === 'stale' || Boolean(market && market.status !== 'official')
  const state = loading && model.total === 0
    ? 'loading'
    : error && model.total === 0
      ? 'error'
      : model.total === 0
        ? 'empty'
        : stale
          ? 'stale'
          : 'ready'

  return (
    <DashboardCard
      data-testid="market-breadth-card"
      className={className}
      title="市場廣度"
      eyebrow="MARKET BREADTH"
      subtitle="觀察上漲、下跌與平盤家數分布。"
      updatedAt={heatmap?.generatedAt ?? market?.fetchedAt}
      stale={stale}
      state={state}
      action={<Badge tone={model.label === '偏多' ? 'up' : model.label === '偏空' ? 'down' : model.label === '資料不足' ? 'warning' : 'neutral'}>{model.label}</Badge>}
    >
      <DashboardDataState
        loading={loading && model.total === 0}
        error={error && model.total === 0 ? error : null}
        empty={!loading && model.total === 0}
        onRetry={onRetry}
        emptyTitle="市場廣度尚未取得"
        emptyDescription="需要上漲、下跌與平盤家數才能顯示。"
      >
        <div className="space-y-4 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.06] bg-white/[.025] text-brand-300">
              <Gauge size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-200">{model.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{model.description}</p>
            </div>
            <div className="flex shrink-0 rounded-xl border border-white/[.06] p-1" role="group" aria-label="市場廣度顯示方式">
              <Toggle active={view === 'count'} onClick={() => setView('count')}>家數</Toggle>
              <Toggle active={view === 'percent'} onClick={() => setView('percent')}>比例</Toggle>
            </div>
          </div>

          <div>
            <div className="flex h-3 overflow-hidden rounded-full bg-white/[.04]" aria-label={`上漲 ${model.advancePercent.toFixed(1)}%，下跌 ${model.declinePercent.toFixed(1)}%，平盤 ${model.unchangedPercent.toFixed(1)}%`}>
              <span className="bg-red-400/75 transition-[width] duration-300" style={{ width: `${model.advancePercent}%` }} />
              <span className="bg-emerald-400/75 transition-[width] duration-300" style={{ width: `${model.declinePercent}%` }} />
              <span className="bg-slate-500/70 transition-[width] duration-300" style={{ width: `${model.unchangedPercent}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <BreadthMetric icon={<ArrowUp size={14} />} label="上漲" value={model.advance} percent={model.advancePercent} tone="up" view={view} />
              <BreadthMetric icon={<ArrowDown size={14} />} label="下跌" value={model.decline} percent={model.declinePercent} tone="down" view={view} />
              <BreadthMetric icon={<Minus size={14} />} label="平盤" value={model.unchanged} percent={model.unchangedPercent} tone="neutral" view={view} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <CompactMetric label="漲幅 ≥ 3%" value={model.gainAboveThree} />
            <CompactMetric label="跌幅 ≤ -3%" value={model.declineBelowThree} />
            <CompactMetric label="漲幅 ≥ 9.5%" value={model.limitUp} note="衍生統計" />
            <CompactMetric label="跌幅 ≤ -9.5%" value={model.limitDown} note="衍生統計" />
          </div>
          <p className="text-[11px] leading-5 text-slate-600">
            9.5% 門檻為 GULI 衍生統計，不是證交所官方漲停／跌停家數。
          </p>
        </div>
      </DashboardDataState>
    </DashboardCard>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 rounded-lg px-2.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 ${active ? 'bg-brand-400/10 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}>{children}</button>
}

function BreadthMetric({
  icon,
  label,
  value,
  percent,
  tone,
  view,
}: {
  icon: ReactNode
  label: string
  value: number | null
  percent: number
  tone: 'up' | 'down' | 'neutral'
  view: 'count' | 'percent'
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[.05] bg-black/10 p-2.5">
      <p className={`flex items-center gap-1 text-xs ${tone === 'up' ? 'text-red-300' : tone === 'down' ? 'text-emerald-300' : 'text-slate-400'}`}>{icon}{label}</p>
      <p className="mono mt-1 truncate font-semibold text-white">
        {view === 'count' ? value?.toLocaleString('zh-TW') ?? '尚未取得' : `${percent.toFixed(1)}%`}
      </p>
      <p className="mono mt-0.5 text-[10px] text-slate-600">
        {view === 'count' ? `${percent.toFixed(1)}%` : `${value?.toLocaleString('zh-TW') ?? '—'} 家`}
      </p>
    </div>
  )
}

function CompactMetric({ label, value, note }: { label: string; value: number | null; note?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[.05] bg-white/[.015] p-2.5">
      <p className="truncate text-xs text-slate-500">{label}</p>
      <p className="mono mt-1 text-base font-semibold text-slate-200">{value?.toLocaleString('zh-TW') ?? '尚未取得'}</p>
      {note && <p className="mt-0.5 text-[10px] text-amber-300/70">{note}</p>}
    </div>
  )
}
