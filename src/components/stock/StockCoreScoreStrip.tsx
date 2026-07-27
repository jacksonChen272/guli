import { Activity, Camera, HeartPulse, Scale, ShieldAlert } from 'lucide-react'
import { useId, useState } from 'react'
import type { StockScoreCardViewModel, StockScoreId } from '../../services/stock/StockScoreViewModel'
import { DashboardCard } from '../dashboard/DashboardCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const icons = {
  decision: Scale,
  technical: Activity,
  health: HeartPulse,
  risk: ShieldAlert,
  snapshot: Camera,
} satisfies Record<StockScoreId, typeof Scale>

const tone = (status: StockScoreCardViewModel['dataStatus']) =>
  status === 'missing' || status === 'stale' || status === 'partial'
    ? 'warning'
    : status === 'official'
      ? 'info'
      : 'brand'

export function StockCoreScoreStrip({
  scores,
  onOpenDecisionTrace,
}: {
  scores: StockScoreCardViewModel[]
  onOpenDecisionTrace: () => void
}) {
  const [expanded, setExpanded] = useState<StockScoreId | null>(null)
  const detailsId = useId()

  return (
    <section aria-labelledby="stock-core-score-title" data-testid="stock-core-score-strip">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">FIVE INDEPENDENT VIEWS</p>
          <h2 id="stock-core-score-title" className="mt-1 text-xl font-semibold text-white">五項核心觀察</h2>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-slate-500">
          各分數沿用既有資料與公式；風險為類別量尺，不與 0–100 分混用。
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-5">
        {scores.map((score) => {
          const Icon = icons[score.id]
          const isOpen = expanded === score.id
          const hasMeter = score.id !== 'risk' && score.value !== null && Number.isFinite(score.value)
          const boundedValue = hasMeter ? Math.max(0, Math.min(100, score.value ?? 0)) : null
          const panelId = `${detailsId}-${score.id}`

          return (
            <DashboardCard
              key={score.id}
              title={score.label}
              updatedAt={score.tradeDate}
              state={score.dataStatus === 'missing' ? 'empty' : score.dataStatus === 'stale' ? 'stale' : 'ready'}
              className="min-w-0"
              data-score-id={score.id}
            >
              <div className="flex h-full min-w-0 flex-col p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-400/10 text-brand-300 sm:h-10 sm:w-10">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <Badge tone={tone(score.dataStatus)}>{score.statusLabel}</Badge>
                </div>

                <p className={`mono mt-4 break-words text-2xl font-semibold tabular-nums sm:mt-5 sm:text-3xl ${score.dataStatus === 'missing' ? 'text-slate-500' : 'text-white'}`}>
                  {score.valueLabel}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">{score.scaleLabel}</p>

                {boundedValue !== null && (
                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]"
                    role="meter"
                    aria-label={`${score.label} ${Math.round(boundedValue)} 分`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(boundedValue)}
                  >
                    <span
                      className="block h-full rounded-full bg-brand-400 transition-[width] duration-300 motion-reduce:transition-none"
                      style={{ width: `${boundedValue}%` }}
                    />
                  </div>
                )}

                <p className="mt-3 min-h-5 text-xs leading-5 text-slate-500">
                  {score.confidence === null
                    ? score.statusReason ?? score.dataStatus
                    : `Confidence ${Math.round(score.confidence)}%${score.statusReason ? ` · ${score.statusReason}` : ''}`}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{score.description}</p>

                <Button
                  className="mt-auto w-full pt-2"
                  size="sm"
                  variant="ghost"
                  onClick={() => score.id === 'decision' ? onOpenDecisionTrace() : setExpanded(isOpen ? null : score.id)}
                  aria-expanded={score.id === 'decision' ? undefined : isOpen}
                  aria-controls={score.id === 'decision' ? undefined : panelId}
                >
                  {score.id === 'decision' ? '查看 Decision Trace' : isOpen ? '收合說明' : '查看說明'}
                </Button>

                {isOpen && score.id !== 'decision' && (
                  <div id={panelId} className="mt-3 border-t border-white/[.06] pt-3 text-xs leading-5 text-slate-400">
                    <p>{score.description}</p>
                    <p className="mt-2 break-words text-[10px] text-slate-600">{score.source}</p>
                  </div>
                )}
              </div>
            </DashboardCard>
          )
        })}
      </div>
    </section>
  )
}
