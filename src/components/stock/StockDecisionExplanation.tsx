import { AlertTriangle, CheckCircle2, CircleHelp, Database, GitBranch, MinusCircle, Scale } from 'lucide-react'
import type { DecisionFactor, DecisionResult } from '../../types/decision'
import { DashboardCard } from '../dashboard/DashboardCard'
import { DashboardDataState } from '../dashboard/DashboardDataState'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export interface DecisionFactorGroups {
  positive: DecisionFactor[]
  neutral: DecisionFactor[]
  negative: DecisionFactor[]
  missing: DecisionFactor[]
}

export function groupDecisionFactors(factors: DecisionFactor[]): DecisionFactorGroups {
  const unique = [...new Map(factors.map((factor) => [factor.code, factor])).values()]
  const missing = unique.filter((factor) =>
    factor.sourceType === 'missing'
    || factor.direction === 'unknown'
    || factor.rawValue === null
    || factor.contribution === null)
  const missingCodes = new Set(missing.map((factor) => factor.code))
  const available = unique.filter((factor) => !missingCodes.has(factor.code))
  const classify = (factor: DecisionFactor) => {
    if (factor.direction === 'positive') return 'positive'
    if (factor.direction === 'negative') return 'negative'
    if (factor.direction === 'neutral') return 'neutral'
    if ((factor.contribution ?? 0) > 0) return 'positive'
    if ((factor.contribution ?? 0) < 0) return 'negative'
    return 'neutral'
  }

  return {
    positive: available
      .filter((factor) => classify(factor) === 'positive')
      .sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0)),
    neutral: available
      .filter((factor) => classify(factor) === 'neutral'),
    negative: available
      .filter((factor) => classify(factor) === 'negative')
      .sort((a, b) => (a.contribution ?? 0) - (b.contribution ?? 0)),
    missing,
  }
}

export function StockDecisionExplanation({
  decision,
  onOpenTrace,
  onRetry,
}: {
  decision: DecisionResult | null
  onOpenTrace: () => void
  onRetry: () => void
}) {
  const groups = groupDecisionFactors(decision?.factors ?? [])

  return (
    <DashboardCard
      title="Decision 說明"
      eyebrow="EXISTING DECISION RESULT"
      subtitle="直接引用 DecisionRepository 的既有分數、因子貢獻、資料來源與交易日期。"
      updatedAt={decision?.tradeDate}
      state={decision ? 'ready' : 'empty'}
      data-testid="stock-decision-explanation"
      action={decision && (
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{decision.label}</Badge>
          <Badge tone="info">Confidence {Math.round(decision.confidence)}%</Badge>
        </div>
      )}
    >
      <DashboardDataState
        loading={false}
        empty={!decision}
        onRetry={onRetry}
        emptyTitle="Decision 尚未取得"
        emptyDescription="其他已取得的行情、技術與法人區塊仍可繼續使用。"
      >
        {decision && (
          <div className="space-y-4 p-4 sm:p-5">
            <section className="rounded-2xl border border-brand-400/15 bg-brand-400/[.025] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-brand-300">
                    <Scale size={18} aria-hidden="true" />
                    GULI Decision
                  </p>
                  <p className="mono mt-3 text-4xl font-semibold tabular-nums text-white">
                    {decision.score === null || !Number.isFinite(decision.score) ? '尚未取得' : decision.score.toFixed(1)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">{decision.direction}</Badge>
                  <Badge tone="neutral">資料日 {decision.tradeDate}</Badge>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{decision.summary}</p>
            </section>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FactorGroup
                title="正向因子"
                icon={<CheckCircle2 size={17} className="text-red-300" aria-hidden="true" />}
                items={groups.positive}
                tone="positive"
              />
              <FactorGroup
                title="中性因子"
                icon={<MinusCircle size={17} className="text-slate-400" aria-hidden="true" />}
                items={groups.neutral}
                tone="neutral"
              />
              <FactorGroup
                title="扣分因子"
                icon={<AlertTriangle size={17} className="text-amber-300" aria-hidden="true" />}
                items={groups.negative}
                tone="negative"
              />
              <FactorGroup
                title="資料不足因子"
                icon={<CircleHelp size={17} className="text-sky-300" aria-hidden="true" />}
                items={groups.missing}
                tone="missing"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-white/[.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-slate-500">
                <GitBranch size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                完整 Trace 顯示既有權重、因子貢獻、缺值正規化、來源與計算步驟。
              </p>
              <Button className="shrink-0" variant="primary" onClick={onOpenTrace}>
                開啟 Decision Trace
              </Button>
            </div>
          </div>
        )}
      </DashboardDataState>
    </DashboardCard>
  )
}

function FactorGroup({
  title,
  icon,
  items,
  tone,
}: {
  title: string
  icon: React.ReactNode
  items: DecisionFactor[]
  tone: 'positive' | 'neutral' | 'negative' | 'missing'
}) {
  if (!items.length) return null

  return (
    <section className="min-w-0 rounded-2xl border border-white/[.06] p-4" data-factor-group={tone}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">{icon}{title}</h3>
      <div className="mt-4 space-y-2">
        {items.slice(0, 6).map((factor) => {
          const dates = [...new Set(factor.evidence.map((item) => item.tradeDate).filter(Boolean))]
          const sources = [...new Set(factor.evidence.map((item) => item.source).filter(Boolean))]
          return (
            <details key={factor.code} className="group rounded-xl bg-white/[.025] p-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60">
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium text-slate-200">{factor.name}</span>
                  <span className="mt-1 block text-[10px] text-slate-600">
                    權重 {(factor.weight * 100).toFixed(0)}%
                  </span>
                </span>
                <span className="mono shrink-0 text-xs tabular-nums text-slate-400">
                  {factor.contribution === null ? '—' : factor.contribution.toFixed(2)}
                </span>
              </summary>
              <div className="border-t border-white/[.06] pt-3 text-xs leading-5 text-slate-400">
                <p>{factor.explanation}</p>
                <p className="mt-2 flex items-start gap-2 break-words text-[10px] text-slate-600">
                  <Database size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    {factor.sourceType} · {sources.join('、') || '來源尚未取得'}
                    {dates.length ? ` · ${dates.join('、')}` : ''}
                  </span>
                </p>
              </div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
