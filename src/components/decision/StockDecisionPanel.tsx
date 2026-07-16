import { ArrowDownRight, ArrowUpRight, CircleHelp, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { DecisionComparison, DecisionResult } from '../../types/decision'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'
import { DecisionComparisonCard } from './DecisionComparisonCard'
import { DecisionFactorCard } from './DecisionFactorCard'
import { DecisionScoreCard } from './DecisionScoreCard'

export function StockDecisionPanel({ symbol }: { symbol: string }) {
  const [decision, setDecision] = useState<DecisionResult | null>(null)
  const [comparison, setComparison] = useState<DecisionComparison | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { let active = true; repositoryHub.decisions.getStockDecision(symbol).then((result) => { if (!active) return; setDecision(result); return repositoryHub.decisions.getDecisionComparison('stock', symbol, result.tradeDate) }).then((result) => { if (active && result) setComparison(result) }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : '決策資料載入失敗') }); return () => { active = false } }, [symbol])
  if (error) return <Card state="error"><p className="p-5 text-sm text-amber-200">{error}</p></Card>
  if (!decision) return <Card title="GULI 決策評估" eyebrow="DECISION ENGINE" state="loading"><LoadingState rows={5} /></Card>
  const positive = decision.factors.filter((factor) => (factor.contribution ?? 0) > 0).sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0))
  const pressure = decision.factors.filter((factor) => (factor.contribution ?? 0) < 0).sort((a, b) => (a.contribution ?? 0) - (b.contribution ?? 0))
  const missing = decision.factors.filter((factor) => factor.contribution === null || factor.sourceType === 'missing' || factor.direction === 'unknown')
  return <section className="space-y-6" aria-label="GULI 個股決策評估">
    <div className="rounded-xl border border-brand-400/20 bg-brand-400/[.035] px-5 py-4"><p className="text-sm font-semibold tracking-[.1em] text-brand-300">GULI 決策評估 · DECISION ENGINE v1.0</p><p className="mt-2 text-sm leading-6 text-slate-400">Decision Score、健康分數與 Stock Snapshot Score 分開計算，各自反映不同觀察面向。</p></div>
    <DecisionScoreCard decision={decision} />
    <Card title="決策因子" eyebrow="FACTORS · WEIGHT · CONTRIBUTION" variant="spacious" action={<Badge tone="info">Confidence {decision.confidence}%</Badge>}><div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-3"><FactorColumn title="正向因子" icon={<ArrowUpRight size={18} className="text-red-300" />} factors={positive} empty="目前沒有正向貢獻因子。" /><FactorColumn title="壓力因子" icon={<ArrowDownRight size={18} className="text-emerald-300" />} factors={pressure} empty="目前沒有主要壓力因子。" /><FactorColumn title="缺值因子" icon={<CircleHelp size={18} className="text-amber-300" />} factors={missing} empty="本次計算沒有缺值因子。" /></div></Card>
    <Card title="主要風險" eyebrow="RISK RULES" variant="standard"><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">{decision.risks.length ? decision.risks.slice(0, 4).map((risk) => <div key={risk.code} className="rounded-xl border border-amber-400/15 bg-amber-400/[.02] p-4"><div className="flex justify-between gap-2"><span className="text-[15px] font-medium text-white">{risk.title}</span><Badge tone={risk.severity === 'high' ? 'up' : 'warning'}><ShieldAlert size={13} className="mr-1" />{risk.severity}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-400">{risk.explanation}</p></div>) : <p className="text-sm text-slate-500">目前沒有規則型風險。</p>}</div></Card>
    <DecisionComparisonCard comparison={comparison} />
  </section>
}

function FactorColumn({ title, icon, factors, empty }: { title: string; icon: React.ReactNode; factors: DecisionResult['factors']; empty: string }) { return <section><h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">{icon}{title}</h3><div className="space-y-3">{factors.length ? factors.map((factor) => <DecisionFactorCard key={factor.code} factor={factor} />) : <p className="rounded-xl border border-dashed border-white/[.08] p-4 text-sm text-slate-500">{empty}</p>}</div></section> }
