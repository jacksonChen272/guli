import { ArrowDownRight, ArrowUpRight, GitBranch, ShieldAlert } from 'lucide-react'
import type { DecisionComparison, DecisionResult } from '../../types/decision'
import { formatComparison, formatConfidence, formatDecisionScore } from '../../lib/formatters'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function DecisionMarketOverviewCard({ decision, comparison, onTrace }: { decision: DecisionResult; comparison: DecisionComparison | null; onTrace: () => void }) {
  const positive = decision.factors.filter((factor) => (factor.contribution ?? 0) > 0).sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0)).slice(0, 3)
  const pressure = decision.factors.filter((factor) => (factor.contribution ?? 0) < 0).sort((a, b) => (a.contribution ?? 0) - (b.contribution ?? 0)).slice(0, 3)
  return <Card title="市場 Decision" eyebrow="DECISION ENGINE · MARKET" variant="standard" action={<Button variant="ghost" onClick={onTrace} icon={<GitBranch size={16} />}>Decision Trace</Button>}>
    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[.9fr_1.1fr]">
      <section>
        <div className="flex flex-wrap items-center gap-2"><Badge tone={decision.direction === 'bullish' ? 'up' : decision.direction === 'bearish' ? 'down' : 'neutral'}>{decision.label}</Badge><Badge tone="info">Confidence {formatConfidence(decision.confidence)}</Badge></div>
        <p className="mono metric-large mt-4 font-semibold text-white">{formatDecisionScore(decision.score)}</p>
        <dl className="mt-5 grid grid-cols-2 gap-3"><Metric label="市場方向" value={directionLabel(decision.direction)} /><Metric label="公式版本" value={decision.trace.formulaVersion} /></dl>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <FactorList title="正向因子 Top 3" icon={<ArrowUpRight size={17} />} items={positive.map((item) => `${item.name} ${signed(item.contribution)}`)} />
        <FactorList title="壓力因子 Top 3" icon={<ArrowDownRight size={17} />} items={pressure.map((item) => `${item.name} ${signed(item.contribution)}`)} />
        <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2"><Metric label="高風險項目" value={`${decision.risks.filter((risk) => risk.severity === 'high').length} 項`} icon={<ShieldAlert size={15} />} /><Metric label="官方資料覆蓋" value={`${Math.round(decision.trace.availableWeight * 100)}%`} /></div>
      </section>
    </div>
    <div className="grid gap-3 border-t border-[var(--border-subtle)] px-5 py-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6"><p className="leading-6 text-slate-400">{decision.summary}</p><span className="text-slate-500">前期比較：{comparison?.available ? formatComparison(comparison.scoreChange) : '尚無前期資料'}</span><span className="mono text-slate-500">{decision.tradeDate}</span></div>
  </Card>
}

function FactorList({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) { return <div className="rounded-xl border border-white/[.06] p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">{icon}{title}</h3><ul className="mt-3 space-y-2">{items.length ? items.map((item) => <li key={item} className="text-sm text-slate-400">• {item}</li>) : <li className="text-sm text-slate-500">目前沒有符合條件的因子</li>}</ul></div> }
function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="rounded-xl border border-white/[.06] bg-white/[.018] p-4"><dt className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</dt><dd className="mono mt-2 text-base text-white">{value}</dd></div> }
const signed = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`
const directionLabel = (value: DecisionResult['direction']) => value === 'bullish' ? '偏多 ↑' : value === 'bearish' ? '偏空 ↓' : value === 'neutral' ? '中性 →' : '資料不足'
