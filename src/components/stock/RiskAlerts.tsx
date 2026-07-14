import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { StockRiskAlert } from '../../types/insight'
import { Badge } from '../ui/Badge'

export function RiskAlerts({ risks }: { risks: StockRiskAlert[] }) {
  if (!risks.length) return <div className="flex items-start gap-3 rounded-2xl border border-brand-400/15 bg-brand-400/[.035] p-4"><CheckCircle2 size={18} className="mt-0.5 text-brand-300"/><div><p className="text-xs font-medium text-white">目前無重大風險訊號</p><p className="mt-1 text-[10px] leading-5 text-slate-500">仍需持續觀察市場、產業與個股資料變化。</p></div></div>
  return <div className="space-y-3">{risks.map((risk) => <article key={risk.id} className="rounded-2xl border border-[var(--border-subtle)] border-l-2 border-l-amber-400 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><AlertTriangle size={15} className="text-amber-300"/><h3 className="text-xs font-semibold text-white">{risk.label}</h3></div><Badge tone={risk.severity === '高' ? 'warning' : 'neutral'}>{risk.severity}風險</Badge></div><p className="mt-3 text-[11px] leading-5 text-slate-400">{risk.reason}</p><dl className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2"><div><dt className="text-slate-600">觸發條件</dt><dd className="mt-1 text-slate-400">{risk.condition}</dd></div><div><dt className="text-slate-600">注意事項</dt><dd className="mt-1 text-slate-400">{risk.advice}</dd></div></dl></article>)}</div>
}
