import { ArrowRight, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { mockSignals } from '../../data/mockSignals'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export function MarketSummary() {
  const navigate = useNavigate()
  return <Card title="今日市場摘要" eyebrow="GULI Intelligence" action={<span className="flex items-center gap-1.5 text-[9px] text-brand-400"><Radio size={11} /> 即時訊號</span>}><div className="divide-y divide-white/[0.055]">{mockSignals.map((signal) => <article key={signal.id} className="group p-4 transition hover:bg-white/[0.018] sm:p-5"><div className="flex items-start justify-between gap-3"><Badge tone={signal.type === '風險' ? 'warning' : 'brand'}>{signal.type}</Badge><span className="mono text-[9px] text-slate-600">強度 {signal.intensity}</span></div><h3 className="mt-3 text-xs font-medium leading-5 text-slate-200">{signal.title}</h3><p className="mt-1.5 text-[10px] leading-5 text-slate-600">{signal.description}</p><div className="mt-3 flex items-center justify-between"><span className="text-[9px] text-slate-700">{signal.industries.join('、')}</span><button type="button" onClick={() => navigate(`/market-focus?signal=${signal.id}`)} className="flex items-center gap-1 text-[10px] text-slate-500 transition hover:text-brand-300">查看詳情 <ArrowRight size={11} /></button></div><div className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/[0.04]"><div className="h-full bg-brand-400/70" style={{ width: `${signal.intensity}%` }} /></div></article>)}</div></Card>
}
