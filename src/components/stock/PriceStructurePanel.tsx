import { ArrowDownToLine, ArrowUpToLine, GitBranch } from 'lucide-react'
import type { SupportResistanceAnalysis } from '../../types/supportResistance'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

const price = (value: number) => value.toLocaleString('zh-TW', { maximumFractionDigits: value >= 100 ? 1 : 2 })

export function PriceStructurePanel({ analysis }: { analysis: SupportResistanceAnalysis }) {
  return <Card title="趨勢、支撐與壓力" eyebrow="PRICE STRUCTURE v1.0" action={<Badge tone="brand">{analysis.trend.classification}</Badge>}>
    {!analysis.zones.length ? <EmptyState title="歷史資料不足" description={analysis.warnings[0] ?? '尚無法建立支撐與壓力區。'}/> : <div className="grid gap-5 p-5 lg:grid-cols-[.9fr_1.1fr]"><div className="rounded-xl border border-white/[.06] p-4"><p className="flex items-center gap-2 text-sm font-medium text-white"><GitBranch size={17} className="text-brand-300"/>趨勢證據</p><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">{analysis.trend.evidence.map((item) => <li key={item}>• {item}</li>)}</ul><p className="mt-4 text-[11px] text-slate-600">樣本 {analysis.sampleSize} 日 · ATR14 {analysis.atr14?.toFixed(2) ?? '尚未取得'} · {analysis.formulaVersion}</p></div><div className="grid gap-3 sm:grid-cols-2"><ZoneGroup title="支撐區" icon={<ArrowDownToLine size={17} className="text-emerald-300"/>} zones={analysis.supports}/><ZoneGroup title="壓力區" icon={<ArrowUpToLine size={17} className="text-red-300"/>} zones={analysis.resistances}/></div></div>}
  </Card>
}

function ZoneGroup({ title, icon, zones }: { title: string; icon: React.ReactNode; zones: SupportResistanceAnalysis['zones'] }) { return <section className="rounded-xl border border-white/[.06] p-4"><p className="flex items-center gap-2 text-sm font-medium text-white">{icon}{title}</p><div className="mt-3 space-y-3">{zones.length ? zones.slice(0, 3).map((zone) => <article key={zone.id} className="rounded-lg bg-white/[.025] p-3"><div className="flex items-center justify-between gap-2"><span className="mono text-sm text-white">{price(zone.lower)}–{price(zone.upper)}</span><Badge tone="neutral">{zone.strength === 'strong' ? '強' : zone.strength === 'medium' ? '中' : '弱'}</Badge></div><p className="mt-2 text-[11px] text-slate-500">距現價 {zone.distancePercent > 0 ? '+' : ''}{zone.distancePercent.toFixed(2)}% · 觸及 {zone.touchCount} 次</p><p className="mt-1 text-[10px] text-slate-600">{zone.sources.join('、')}</p></article>) : <p className="text-xs text-slate-500">沒有足夠證據，不以推測值補齊。</p>}</div></section> }
