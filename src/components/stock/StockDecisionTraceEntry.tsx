import { GitBranch, Scale } from 'lucide-react'
import type { DecisionResult } from '../../types/decision'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

export function StockDecisionTraceEntry({ decision, onOpen }: { decision: DecisionResult | null; onOpen: () => void }) {
  if (!decision) return <Card title="Decision Trace" eyebrow="DECISION v1.0"><EmptyState title="Decision 尚未取得" description="其他已取得的官方行情與技術資料仍可繼續查看。"/></Card>
  const positive = decision.factors.filter((factor) => (factor.contribution ?? 0) > 0).sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0)).slice(0, 3)
  const negative = decision.factors.filter((factor) => (factor.contribution ?? 0) < 0).sort((a, b) => (a.contribution ?? 0) - (b.contribution ?? 0)).slice(0, 3)
  return <Card title="GULI 決策依據" eyebrow="DECISION TRACE" action={<Badge tone="info">Confidence {decision.confidence}%</Badge>}><div className="grid gap-4 p-5 lg:grid-cols-[.7fr_1fr_1fr]"><div className="rounded-xl border border-brand-400/15 bg-brand-400/[.03] p-4"><Scale size={19} className="text-brand-300"/><p className="mt-3 text-xs text-slate-500">Decision Score</p><p className="mono mt-1 text-3xl text-white">{decision.score?.toFixed(1) ?? '—'}</p><p className="mt-2 text-xs text-slate-500">{decision.label} · {decision.tradeDate}</p></div><FactorGroup title="主要正向因子" items={positive}/><FactorGroup title="主要扣分因子" items={negative}/></div><div className="flex flex-col gap-3 border-t border-white/[.06] p-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><GitBranch size={15} className="mt-0.5 shrink-0"/>完整 Trace 包含權重、貢獻、缺值正規化、來源與計算步驟。</p><Button onClick={onOpen}>開啟 Decision Trace</Button></div></Card>
}

function FactorGroup({ title, items }: { title: string; items: DecisionResult['factors'] }) { return <div className="rounded-xl border border-white/[.06] p-4"><p className="text-sm font-medium text-white">{title}</p><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">{items.length ? items.map((item) => <li key={item.code}>• {item.name}：{item.explanation}</li>) : <li>目前沒有可列出的因子。</li>}</ul></div> }
