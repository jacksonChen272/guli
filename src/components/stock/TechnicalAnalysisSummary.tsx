import { Activity, Gauge, LineChart, Waves } from 'lucide-react'
import type { TechnicalIndicatorSeries, TechnicalSignal } from '../../types/technicalIndicator'
import type { TrendStructureResult } from '../../types/supportResistance'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

const value = (number: number | null | undefined, suffix = '') => number === null || number === undefined ? '尚未取得' : `${number.toLocaleString('zh-TW', { maximumFractionDigits: 2 })}${suffix}`

export function TechnicalAnalysisSummary({ series, trend, signals }: { series: TechnicalIndicatorSeries; trend: TrendStructureResult; signals: TechnicalSignal[] }) {
  const latest = {
    rsi: series.rsi14.at(-1)?.value ?? null,
    k: series.stochastic.at(-1)?.k ?? null,
    d: series.stochastic.at(-1)?.d ?? null,
    macd: series.macd.at(-1)?.histogram ?? null,
    atr: series.atr14.at(-1)?.value ?? null,
    volumeRatio: series.volumeRatio20.at(-1)?.value ?? null,
    volatility: series.volatility20.at(-1)?.value ?? null,
  }
  return <Card title="技術摘要與訊號" eyebrow="DERIVED FROM OFFICIAL HISTORY" action={<Badge tone="brand">{trend.classification}</Badge>}><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<LineChart size={17}/>} label="趨勢結構" value={trend.classification} hint={trend.evidence[0] ?? '資料不足'}/><Metric icon={<Gauge size={17}/>} label="RSI / KD" value={`${value(latest.rsi)} / ${value(latest.k)}・${value(latest.d)}`} hint="RSI14 · KD 9,3,3"/><Metric icon={<Activity size={17}/>} label="MACD / ATR" value={`${value(latest.macd)} / ${value(latest.atr)}`} hint="MACD 12,26,9 · ATR14"/><Metric icon={<Waves size={17}/>} label="量比 / 波動" value={`${value(latest.volumeRatio, 'x')} / ${value(latest.volatility, '%')}`} hint="20 日均量 · 20 日年化波動"/></div><div className="border-t border-white/[.06] p-5"><p className="mb-3 text-sm font-medium text-white">近期技術訊號</p><div className="grid gap-3 md:grid-cols-2">{signals.length ? signals.slice(0, 8).map((signal) => <article key={signal.id} className="rounded-xl border border-white/[.06] p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm text-white">{signal.name}</span><Badge tone={signal.direction === 'positive' ? 'up' : signal.direction === 'negative' ? 'down' : signal.direction === 'warning' ? 'warning' : 'neutral'}>{signal.severity}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-500">{signal.explanation}</p></article>) : <p className="text-sm text-slate-500">目前沒有符合固定規則的技術訊號。</p>}</div></div></Card>
}

function Metric({ icon, label, value: text, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) { return <div className="min-w-0 rounded-xl border border-white/[.06] bg-white/[.015] p-4"><div className="flex items-center gap-2 text-brand-300">{icon}<span className="text-xs text-slate-500">{label}</span></div><p className="mono mt-3 truncate text-base text-white" title={text}>{text}</p><p className="mt-2 text-[11px] text-slate-600">{hint}</p></div> }
