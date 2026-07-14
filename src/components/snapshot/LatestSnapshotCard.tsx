import { ArrowRight, CalendarDays, ShieldAlert, ThermometerSun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { marketSnapshotService } from '../../services/snapshot/MarketSnapshotService'
import type { MarketSnapshot, MarketSnapshotDiff } from '../../types/snapshot'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'
import { SnapshotDiffSummary } from './SnapshotDiffSummary'
import { SnapshotSourceBadge } from './SnapshotSourceBadge'

export function LatestSnapshotCard() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null); const [diff, setDiff] = useState<MarketSnapshotDiff | null>(null); const [error, setError] = useState(''); const navigate = useNavigate()
  useEffect(() => { let active = true; void marketSnapshotService.getLatestSnapshot().then(async (value) => { if (!active) return; setSnapshot(value); setDiff(await marketSnapshotService.getDiff(value.tradeDate)) }).catch(() => active && setError('市場快照暫時無法讀取，Dashboard 其他功能仍可正常使用。')); return () => { active = false } }, [])
  if (error) return <Card title="今日市場快照" eyebrow="MARKET SNAPSHOT"><div className="flex min-h-32 items-center gap-3 p-5 text-[11px] text-amber-200/70"><ShieldAlert size={18}/>{error}</div></Card>
  if (!snapshot) return <Card title="今日市場快照" eyebrow="MARKET SNAPSHOT"><div className="p-5"><LoadingState rows={3}/></div></Card>
  return <Card title="今日市場快照" eyebrow="MARKET SNAPSHOT" action={<Button size="sm" variant="ghost" onClick={() => navigate(`/history?date=${snapshot.tradeDate}`)} icon={<ArrowRight size={13}/>}>查看完整市場回顧</Button>}>
    <div className="grid gap-5 p-5 xl:grid-cols-[1.1fr_.9fr]"><div><div className="flex flex-wrap items-center gap-2"><span className="flex items-center gap-1.5 text-[10px] text-slate-500"><CalendarDays size={13}/>{snapshot.tradeDate}</span><span className="rounded-full border border-brand-400/20 bg-brand-400/10 px-2 py-1 text-[10px] text-brand-300">{snapshot.marketStatus}</span>{snapshot.sources.map((source) => <SnapshotSourceBadge key={source.id} type={source.type}/>)}</div><div className="mt-4 flex items-end gap-4"><div><p className="text-[10px] text-slate-500">市場溫度</p><p className="mono mt-1 text-3xl font-semibold text-white">{snapshot.marketTemperature}<span className="ml-1 text-xs text-slate-600">/100</span></p></div><div className="pb-1"><p className="text-[10px] text-slate-500">信心程度</p><p className="mono mt-1 text-sm text-blue-300">{snapshot.confidence}%</p></div><ThermometerSun className="mb-1 ml-auto text-brand-400" size={28}/></div><p className="mt-4 text-sm font-medium leading-7 text-slate-200">{snapshot.headline}</p><div className="mt-4"><SnapshotDiffSummary diff={diff ?? { hasPrevious: false, currentDate: snapshot.tradeDate, previousDate: null, temperature: { current: snapshot.marketTemperature, previous: null, change: null }, index: { current: snapshot.overview.indexValue, previous: null, change: null }, tradingAmount: { current: snapshot.overview.tradingAmount, previous: null, change: null }, marketStatusChanged: false, previousMarketStatus: null, currentMarketStatus: snapshot.marketStatus, addedTopIndustries: [], removedTopIndustries: [], addedWeakIndustries: [], removedWeakIndustries: [] }}/></div></div>
      <div className="grid gap-3 sm:grid-cols-2"><IndustryList title="最強產業" values={snapshot.topIndustries}/><IndustryList title="最弱產業" values={snapshot.weakIndustries}/><div className="sm:col-span-2 rounded-xl border border-amber-400/10 bg-amber-400/[.025] p-4"><p className="text-[10px] font-medium text-amber-200/80">主要風險</p>{snapshot.risks.length ? snapshot.risks.map((risk) => <p key={risk.id} className="mt-2 text-[10px] leading-5 text-slate-500">• {risk.title}：{risk.description}</p>) : <p className="mt-2 text-[10px] text-slate-600">目前無規則觸發的主要風險。</p>}</div></div>
    </div>
  </Card>
}
function IndustryList({ title, values }: { title: string; values: MarketSnapshot['topIndustries'] }) { return <div className="rounded-xl border border-[var(--border-subtle)] p-4"><p className="text-[10px] text-slate-500">{title}</p>{values.map((item) => <div key={item.name} className="mt-2 flex items-center justify-between text-[10px]"><span className="text-slate-300">{item.rank}. {item.name}</span><span className={item.changePercent >= 0 ? 'text-red-300' : 'text-emerald-300'}>{item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%</span></div>)}</div> }
