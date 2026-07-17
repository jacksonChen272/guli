import { ArrowRight, Clock3, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatAmount, formatConfidence, formatDateTime, formatDecisionScore } from '../../lib/formatters'
import type { DecisionResult } from '../../types/decision'
import type { OfficialMarketOverview } from '../../types/marketData'
import type { InstitutionalMarketTotals } from '../../types/officialInstitutionalData'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { LoadingState } from '../ui/LoadingState'

export function TodayMarketHero({ market, decision, institutions, loading }: {
  market?: OfficialMarketOverview
  decision: DecisionResult | null
  institutions: InstitutionalMarketTotals | null
  loading: boolean
}) {
  const navigate = useNavigate()
  const direction = directionMeta(decision?.direction)
  const DirectionIcon = direction.icon
  const foreignNet = institutions?.foreign.netAmount ?? null
  const updatedAt = market?.fetchedAt ?? decision?.tradeDate ?? null

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-brand-400/15 bg-[#10181a] shadow-[0_18px_50px_rgba(0,0,0,.18)]" aria-labelledby="today-market-title">
      <div className="absolute inset-y-0 left-0 w-1 bg-brand-400/70" aria-hidden="true"/>
      <div className="grid min-w-0 gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1.1fr)_minmax(520px,.9fr)] xl:items-end xl:p-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">今日市場</Badge>
            <Badge tone={market?.status === 'official' ? 'info' : 'warning'}>{market?.status === 'official' ? '證交所盤後資料' : '部分資料待更新'}</Badge>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${direction.boxClass}`}><DirectionIcon size={24}/></span>
            <div className="min-w-0">
              <p className="text-sm text-slate-400">今日市場方向</p>
              <h1 id="today-market-title" className={`mt-1 text-3xl font-semibold tracking-tight sm:text-4xl ${direction.textClass}`}>市場{direction.label}</h1>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {decision?.summary ?? (loading ? '正在整理今日市場方向與重要數據。' : '目前尚未取得完整市場判讀，請稍後重新查看。')}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => navigate('/decisions')} icon={<ArrowRight size={16}/>}>查看市場判讀</Button>
            <span className="flex min-h-11 items-center gap-2 text-xs text-slate-500"><Clock3 size={14}/>最後更新 {formatDateTime(updatedAt)}</span>
          </div>
        </div>

        {loading && !market && !decision ? <LoadingState rows={3}/> : (
          <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
            <HeroMetric label="市場分數" value={formatDecisionScore(decision?.score)} detail={`信心 ${formatConfidence(decision?.confidence)}`} tone="brand"/>
            <HeroMetric label="加權指數" value={market?.indexValue.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) ?? '—'} detail={signed(market?.change, market?.changePercent)} tone={(market?.change ?? 0) >= 0 ? 'up' : 'down'}/>
            <HeroMetric label="外資買賣超" value={formatAmount(foreignNet)} detail="證交所三大法人盤後統計" tone={(foreignNet ?? 0) >= 0 ? 'up' : 'down'}/>
            <HeroMetric label="今日成交值" value={formatAmount(market?.tradingAmount)} detail={market ? `${market.transactionCount.toLocaleString('zh-TW')} 筆成交` : '尚未取得'} tone="neutral"/>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px border-t border-white/[.06] bg-white/[.06]">
        <Breadth label="上漲家數" value={market?.advanceCount} className="text-red-300"/>
        <Breadth label="下跌家數" value={market?.declineCount} className="text-emerald-300"/>
        <Breadth label="平盤家數" value={market?.unchangedCount} className="text-slate-300"/>
      </div>
    </section>
  )
}

function HeroMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'brand' | 'up' | 'down' | 'neutral' }) {
  const valueClass = tone === 'up' ? 'text-red-300' : tone === 'down' ? 'text-emerald-300' : tone === 'brand' ? 'text-brand-300' : 'text-white'
  return <div className="min-w-0 rounded-2xl border border-white/[.07] bg-black/10 p-4 sm:p-5"><p className="text-xs text-slate-500">{label}</p><p className={`mono mt-2 truncate text-xl font-semibold sm:text-2xl ${valueClass}`} title={value}>{value}</p><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{detail}</p></div>
}

function Breadth({ label, value, className }: { label: string; value: number | null | undefined; className: string }) {
  return <div className="min-w-0 bg-[#0d1517] px-3 py-3 text-center sm:px-5"><p className="text-[11px] text-slate-500">{label}</p><p className={`mono mt-1 text-base font-semibold sm:text-lg ${className}`}>{value?.toLocaleString('zh-TW') ?? '—'}</p></div>
}

function signed(change?: number, percent?: number) {
  if (change === undefined || percent === undefined) return '尚未取得漲跌資料'
  return `${change > 0 ? '+' : ''}${change.toFixed(2)} 點 · ${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`
}

function directionMeta(direction?: DecisionResult['direction']) {
  if (direction === 'bullish') return { label: '偏多', icon: TrendingUp, textClass: 'text-red-300', boxClass: 'border-red-400/20 bg-red-400/10 text-red-300' }
  if (direction === 'bearish') return { label: '偏空', icon: TrendingDown, textClass: 'text-emerald-300', boxClass: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' }
  return { label: '中性', icon: Minus, textClass: 'text-slate-100', boxClass: 'border-white/10 bg-white/[.04] text-slate-300' }
}
