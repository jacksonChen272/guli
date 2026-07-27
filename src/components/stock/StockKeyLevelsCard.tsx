import { ArrowDownToLine, ArrowUpToLine, GitBranch, MapPin } from 'lucide-react'
import type { StockAnalysisLoadStatus } from '../../hooks/useStockAnalysisData'
import type { SupportResistanceAnalysis } from '../../types/supportResistance'
import { DashboardCard } from '../dashboard/DashboardCard'
import { DashboardDataState } from '../dashboard/DashboardDataState'
import { Badge } from '../ui/Badge'

const price = (value: number) => value.toLocaleString('zh-TW', {
  maximumFractionDigits: value >= 100 ? 1 : 2,
})

export interface PricePositionModel {
  support: number
  current: number
  resistance: number
  positionPercent: number
  label: string
  supportDistancePercent: number
  resistanceDistancePercent: number
}

export function buildPricePositionModel(analysis: SupportResistanceAnalysis): PricePositionModel | null {
  const supportZone = analysis.supports[0]
  const resistanceZone = analysis.resistances[0]
  const current = analysis.currentPrice
  if (!supportZone || !resistanceZone || current === null || !Number.isFinite(current)) return null

  const support = supportZone.center
  const resistance = resistanceZone.center
  if (!Number.isFinite(support) || !Number.isFinite(resistance) || support >= resistance) return null

  const rawPosition = ((current - support) / (resistance - support)) * 100
  const positionPercent = Math.max(0, Math.min(100, rawPosition))
  const label = current > resistance
    ? '已突破壓力，等待後續確認'
    : current < support
      ? '跌破支撐，風險升高'
      : positionPercent <= 20
        ? '接近支撐區'
        : positionPercent >= 80
          ? '接近壓力區'
          : '位於支撐與壓力中段'

  return {
    support,
    current,
    resistance,
    positionPercent,
    label,
    supportDistancePercent: Math.abs(supportZone.distancePercent),
    resistanceDistancePercent: Math.abs(resistanceZone.distancePercent),
  }
}

export function StockKeyLevelsCard({
  analysis,
  loadStatus,
  error,
  onRetry,
}: {
  analysis: SupportResistanceAnalysis | null
  loadStatus: StockAnalysisLoadStatus
  error?: string | null
  onRetry: () => void
}) {
  const position = analysis ? buildPricePositionModel(analysis) : null

  return (
    <DashboardCard
      title="關鍵價位"
      eyebrow="EXISTING PRICE STRUCTURE"
      subtitle="沿用 support-resistance-v1.0 的既有區間判讀。"
      updatedAt={analysis?.tradeDate}
      state={loadStatus === 'loading' ? 'loading' : error ? 'error' : !analysis?.zones.length ? 'empty' : 'ready'}
      action={analysis && <Badge tone="brand">{analysis.trend.classification}</Badge>}
      className="h-full"
      data-testid="stock-key-levels"
    >
      <DashboardDataState
        loading={loadStatus === 'loading'}
        error={error}
        empty={!analysis?.zones.length}
        onRetry={onRetry}
        emptyTitle="尚未取得可用的關鍵價位"
        emptyDescription={analysis?.warnings[0] ?? '目前歷史樣本不足，無法顯示支撐與壓力區間。'}
        skeleton="rows"
      >
        {analysis && (
          <div className="space-y-4 p-4 sm:p-5">
            <div className="rounded-xl border border-white/[.06] p-4">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <GitBranch size={15} aria-hidden="true" />
                價格結構
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{analysis.trend.classification}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                現價 {analysis.currentPrice === null ? '尚未取得' : price(analysis.currentPrice)}
                {' · '}ATR14 {analysis.atr14?.toFixed(2) ?? '尚未取得'}
                {' · '}樣本 {analysis.sampleSize} 日
              </p>
            </div>

            {position && <PricePosition model={position} />}
            <ZoneList title="支撐" icon={<ArrowDownToLine size={16} className="text-emerald-300" aria-hidden="true" />} zones={analysis.supports} />
            <ZoneList title="壓力" icon={<ArrowUpToLine size={16} className="text-red-300" aria-hidden="true" />} zones={analysis.resistances} />
            <p className="rounded-xl bg-white/[.025] p-3 text-xs leading-5 text-slate-400">{buildLevelInsight(analysis)}</p>
          </div>
        )}
      </DashboardDataState>
    </DashboardCard>
  )
}

function PricePosition({ model }: { model: PricePositionModel }) {
  return (
    <section className="rounded-xl border border-white/[.06] p-4" aria-labelledby="price-position-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="price-position-title" className="flex items-center gap-2 text-sm font-medium text-white">
          <MapPin size={16} className="text-brand-300" aria-hidden="true" />
          價位區間位置
        </h3>
        <Badge tone="neutral">{model.label}</Badge>
      </div>

      <div
        className="relative mt-5 h-2 rounded-full bg-gradient-to-r from-emerald-400/40 via-slate-400/20 to-red-400/40"
        role="meter"
        aria-label={`現價位於支撐與壓力區間的 ${Math.round(model.positionPercent)}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(model.positionPercent)}
      >
        <span
          className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,.12)]"
          style={{ left: `${model.positionPercent}%` }}
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <PricePoint label="支撐" value={model.support} detail={`距離 ${model.supportDistancePercent.toFixed(2)}%`} />
        <PricePoint label="現價" value={model.current} detail="目前位置" emphasize />
        <PricePoint label="壓力" value={model.resistance} detail={`距離 ${model.resistanceDistancePercent.toFixed(2)}%`} />
      </dl>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">此位置條僅呈現既有支撐壓力結果，不是進出場建議。</p>
    </section>
  )
}

function PricePoint({
  label,
  value,
  detail,
  emphasize = false,
}: {
  label: string
  value: number
  detail: string
  emphasize?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className={`mono mt-1 truncate text-sm font-semibold tabular-nums ${emphasize ? 'text-white' : 'text-slate-300'}`}>
        {price(value)}
      </dd>
      <dd className="mt-1 text-[10px] text-slate-600">{detail}</dd>
    </div>
  )
}

export function buildLevelInsight(analysis: SupportResistanceAnalysis) {
  const support = analysis.supports[0]
  const resistance = analysis.resistances[0]
  if (!support && !resistance) return '目前沒有足夠的關鍵價位資料。'
  if (support && resistance) {
    return `最近支撐距離現價 ${Math.abs(support.distancePercent).toFixed(2)}%，最近壓力距離現價 ${Math.abs(resistance.distancePercent).toFixed(2)}%；請配合趨勢與量價資料判讀。`
  }
  if (support) return `目前僅辨識到支撐區，距離現價 ${Math.abs(support.distancePercent).toFixed(2)}%；壓力資料尚不足。`
  return `目前僅辨識到壓力區，距離現價 ${Math.abs(resistance?.distancePercent ?? 0).toFixed(2)}%；支撐資料尚不足。`
}

function ZoneList({
  title,
  icon,
  zones,
}: {
  title: string
  icon: React.ReactNode
  zones: SupportResistanceAnalysis['zones']
}) {
  return (
    <section className="rounded-xl border border-white/[.06] p-4">
      <h3 className="flex items-center gap-2 text-sm font-medium text-white">{icon}{title}</h3>
      <div className="mt-3 space-y-3">
        {zones.length
          ? zones.slice(0, 2).map((zone) => (
              <article key={zone.id} className="rounded-lg bg-white/[.025] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="mono tabular-nums text-sm text-white">{price(zone.lower)}–{price(zone.upper)}</span>
                  <Badge tone="neutral">{zone.strength === 'strong' ? '強' : zone.strength === 'medium' ? '中' : '弱'}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  距離現價 {zone.distancePercent > 0 ? '+' : ''}{zone.distancePercent.toFixed(2)}% · 觸及 {zone.touchCount} 次
                </p>
              </article>
            ))
          : <p className="text-xs text-slate-500">尚未取得可用區間。</p>}
      </div>
    </section>
  )
}
