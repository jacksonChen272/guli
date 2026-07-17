import { ArrowRight, CheckCircle2, Clock3, HelpCircle, Minus, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatAmount, formatConfidence, formatDateTime, formatDecisionScore } from '../../lib/formatters'
import { getOperationEnvironment, type TodayMarketNarrative } from '../../services/dashboard/TodayMarketNarrativeService'
import type { DecisionResult } from '../../types/decision'
import type { OfficialMarketOverview } from '../../types/marketData'
import type { InstitutionalMarketTotals } from '../../types/officialInstitutionalData'
import { GlobalStockSearch } from '../search/GlobalStockSearch'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { LoadingState } from '../ui/LoadingState'

export function TodayMarketHero({ market, decision, institutions, narrative, loading }: {
  market?: OfficialMarketOverview
  decision: DecisionResult | null
  institutions: InstitutionalMarketTotals | null
  narrative: TodayMarketNarrative
  loading: boolean
}) {
  const navigate = useNavigate()
  const direction = directionMeta(narrative.stance)
  const DirectionIcon = direction.icon
  const foreignNet = institutions?.foreign.netAmount ?? null
  const updatedAt = market?.fetchedAt ?? narrative.tradeDate
  const environment = getOperationEnvironment(narrative.stance)

  return <section className="relative overflow-hidden rounded-[24px] border border-brand-400/15 bg-[#10181a] shadow-[0_18px_50px_rgba(0,0,0,.18)]" aria-labelledby="today-market-title">
    <div className="absolute inset-y-0 left-0 w-1 bg-brand-400/70" aria-hidden="true"/>
    <div className="grid min-w-0 gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1.08fr)_minmax(520px,.92fr)] xl:items-start xl:p-8">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="brand">今日市場</Badge><Badge tone={market?.status === 'official' ? 'info' : 'warning'}>{market?.status === 'official' ? '證交所盤後資料' : '部分資料待更新'}</Badge></div>
        <div className="mt-6 flex items-center gap-3"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${direction.boxClass}`}><DirectionIcon size={24}/></span><div className="min-w-0"><p className="text-sm text-slate-400">今日市場方向</p><p className={`mt-1 text-xl font-semibold ${direction.textClass}`}>{direction.label}</p></div></div>
        <h1 id="today-market-title" className="mt-5 max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">{narrative.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{narrative.summary}</p>

        <details className="group mt-4 rounded-xl border border-white/[.07] bg-black/10 px-4 py-3">
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm font-medium text-brand-300"><HelpCircle size={16}/>為什麼？<span className="ml-auto text-xs text-slate-600">固定規則依據</span></summary>
          <div className="mt-3 grid gap-4 border-t border-white/[.06] pt-3 sm:grid-cols-2">
            <FactorList title="正向條件" items={narrative.positiveFactors} icon={<CheckCircle2 size={14} className="text-red-300"/>}/>
            <FactorList title="需要留意" items={[...narrative.negativeFactors, ...narrative.riskNotes].slice(0, 5)} icon={<ShieldAlert size={14} className="text-amber-300"/>}/>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">資料來源：{narrative.sourceSummary.join('、') || '尚未取得'} · 規則版本 {narrative.formulaVersion}</p>
        </details>

        <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.02] p-4"><p className="text-xs font-semibold tracking-wide text-slate-300">今日操作環境</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{environment.map((item) => <p key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-400"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"/>{item}</p>)}</div></div>
        <div className="mt-5 max-w-xl"><p className="mb-2 text-xs text-slate-500">快速查看個股</p><GlobalStockSearch variant="hero"/></div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><Button variant="primary" onClick={() => navigate('/decisions')} icon={<ArrowRight size={16}/>}>查看市場判讀</Button><span className="flex min-h-11 items-center gap-2 text-xs text-slate-500"><Clock3 size={14}/>最後更新 {formatDateTime(updatedAt)}</span></div>
      </div>

      {loading && !market && !decision ? <LoadingState rows={4}/> : <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
        <HeroMetric label="市場判讀分數" value={formatDecisionScore(decision?.score)} detail={`信心 ${formatConfidence(narrative.confidence)}`} tone={direction.metricTone}/>
        <HeroMetric label="加權指數" value={market?.indexValue.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) ?? '—'} detail={signed(market?.change, market?.changePercent)} tone={(market?.change ?? 0) > 0 ? 'up' : (market?.change ?? 0) < 0 ? 'down' : 'neutral'}/>
        <HeroMetric label="外資買賣超" value={formatAmount(foreignNet)} detail="證交所三大法人盤後統計" tone={(foreignNet ?? 0) > 0 ? 'up' : (foreignNet ?? 0) < 0 ? 'down' : 'neutral'}/>
        <HeroMetric label="今日成交值" value={formatAmount(market?.tradingAmount)} detail={market ? `${market.transactionCount.toLocaleString('zh-TW')} 筆成交` : '尚未取得'} tone="neutral"/>
      </div>}
    </div>
    <div className="grid grid-cols-3 gap-px border-t border-white/[.06] bg-white/[.06]"><Breadth label="上漲家數" value={market?.advanceCount} className="text-red-300"/><Breadth label="下跌家數" value={market?.declineCount} className="text-emerald-300"/><Breadth label="平盤家數" value={market?.unchangedCount} className="text-slate-300"/></div>
  </section>
}

function FactorList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) { return <div><p className="flex items-center gap-2 text-xs font-medium text-slate-300">{icon}{title}</p>{items.length ? <ul className="mt-2 space-y-1.5">{items.map((item) => <li key={item} className="text-xs leading-5 text-slate-500">• {item}</li>)}</ul> : <p className="mt-2 text-xs text-slate-600">目前沒有足夠資料</p>}</div> }
function HeroMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'brand' | 'up' | 'down' | 'neutral' }) { const valueClass = tone === 'up' ? 'text-red-300' : tone === 'down' ? 'text-emerald-300' : tone === 'brand' ? 'text-brand-300' : 'text-white'; const borderClass = tone === 'up' ? 'border-red-400/15' : tone === 'down' ? 'border-emerald-400/15' : 'border-white/[.07]'; return <div className={`min-w-0 rounded-2xl border bg-black/10 p-4 sm:p-5 ${borderClass}`}><p className="text-xs text-slate-500">{label}</p><p className={`mono mt-2 truncate text-xl font-semibold sm:text-2xl ${valueClass}`} title={value}>{value}</p><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{detail}</p></div> }
function Breadth({ label, value, className }: { label: string; value: number | null | undefined; className: string }) { return <div className="min-w-0 bg-[#0d1517] px-3 py-3 text-center sm:px-5"><p className="text-[11px] text-slate-500">{label}</p><p className={`mono mt-1 text-base font-semibold sm:text-lg ${className}`}>{value?.toLocaleString('zh-TW') ?? '—'}</p></div> }
function signed(change?: number, percent?: number) { if (change === undefined || percent === undefined) return '尚未取得漲跌資料'; return `${change > 0 ? '+' : ''}${change.toFixed(2)} 點 · ${percent > 0 ? '+' : ''}${percent.toFixed(2)}%` }
function directionMeta(stance: TodayMarketNarrative['stance']) {
  if (stance === 'bullish') return { label: '偏多', icon: TrendingUp, textClass: 'text-red-300', boxClass: 'border-red-400/20 bg-red-400/10 text-red-300', metricTone: 'up' as const }
  if (stance === 'bearish') return { label: '偏空', icon: TrendingDown, textClass: 'text-emerald-300', boxClass: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300', metricTone: 'down' as const }
  if (stance === 'insufficient') return { label: '資料不足', icon: ShieldAlert, textClass: 'text-amber-200', boxClass: 'border-amber-400/20 bg-amber-400/10 text-amber-200', metricTone: 'neutral' as const }
  return { label: '中性', icon: Minus, textClass: 'text-slate-100', boxClass: 'border-white/10 bg-white/[.04] text-slate-300', metricTone: 'neutral' as const }
}
