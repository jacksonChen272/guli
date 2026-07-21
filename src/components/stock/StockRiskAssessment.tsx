import { AlertTriangle, ShieldCheck } from 'lucide-react'
import type { StockRiskAssessmentItem } from '../../types/stockRiskAssessment'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

const label = { high: '高', medium: '中', low: '低' } as const

export function StockRiskAssessment({ risks }: { risks: StockRiskAssessmentItem[] }) {
  return <Card title="風險評估" eyebrow="FIXED RISK RULES" action={<Badge tone={risks.some((risk) => risk.severity === 'high') ? 'warning' : 'neutral'}>{risks.length} 項</Badge>}><div className="grid gap-3 p-5 md:grid-cols-2">{risks.length ? risks.map((risk) => <article key={risk.id} className={`rounded-xl border p-4 ${risk.severity === 'high' ? 'border-amber-400/25 bg-amber-400/[.035]' : 'border-white/[.06]'}`}><div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-medium text-white"><AlertTriangle size={16} className={risk.severity === 'high' ? 'text-amber-300' : 'text-slate-500'}/>{risk.title}</p><Badge tone={risk.severity === 'high' ? 'warning' : 'neutral'}>{label[risk.severity]}風險</Badge></div><p className="mt-3 text-xs leading-6 text-slate-400">{risk.explanation}</p><p className="mt-3 text-[10px] text-slate-600">{risk.category} · {risk.tradeDate ?? '日期未取得'} · {risk.source}</p></article>) : <div className="col-span-full flex min-h-32 flex-col items-center justify-center text-center"><ShieldCheck size={26} className="text-brand-300"/><p className="mt-3 text-sm text-slate-300">目前未觸發固定風險規則</p><p className="mt-1 text-xs text-slate-600">未觸發不等於沒有投資風險。</p></div>}</div></Card>
}
