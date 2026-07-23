import { AlertTriangle, CheckCircle2, Eye } from 'lucide-react'
import type { StockNarrativeResult } from '../../types/stockNarrative'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { Disclaimer } from '../ui/Disclaimer'

export function StockNarrativePanel({ narrative }: { narrative: StockNarrativeResult }) {
  return <Card title="今日個股判讀" eyebrow="RULE-BASED NARRATIVE" action={<div className="flex gap-2"><Badge tone={narrative.stance === '偏多' ? 'up' : narrative.stance === '偏空' ? 'down' : 'neutral'}>{narrative.stance}</Badge><Badge tone="info">信心 {narrative.confidence}%</Badge></div>}>
    <div className="space-y-5 p-5 sm:p-6"><div><h3 className="text-lg font-semibold leading-8 text-white">{narrative.headline}</h3><p className="mt-2 text-sm leading-7 text-slate-400">{narrative.summary}</p></div><div className="grid gap-4 lg:grid-cols-3"><FactorList title="正向因子" icon={<CheckCircle2 size={17} className="text-red-300"/>} items={narrative.positiveFactors}/><FactorList title="主要風險" icon={<AlertTriangle size={17} className="text-amber-300"/>} items={narrative.riskFactors}/><div className="rounded-xl border border-blue-400/15 bg-blue-400/[.025] p-4"><p className="flex items-center gap-2 text-sm font-medium text-white"><Eye size={17} className="text-blue-300"/>觀察重點</p><p className="mt-3 text-xs leading-6 text-slate-400">{narrative.observation}</p></div></div><p className="text-[11px] text-slate-600">{narrative.formulaVersion} · {narrative.tradeDate ?? '日期未取得'} · 固定規則產生</p><Disclaimer>本內容僅供資訊參考，不構成投資建議、買賣邀約或獲利保證。</Disclaimer></div>
  </Card>
}

function FactorList({ title, icon, items }: { title: string; icon: React.ReactNode; items: StockNarrativeResult['positiveFactors'] }) { return <div className="rounded-xl border border-white/[.06] p-4"><p className="flex items-center gap-2 text-sm font-medium text-white">{icon}{title}</p><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">{items.length ? items.slice(0, 3).map((item) => <li key={item.code}>• {item.explanation}</li>) : <li>尚未形成明確訊號。</li>}</ul></div> }
