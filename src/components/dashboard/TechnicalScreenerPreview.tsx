import { Activity, ArrowRight, ChartNoAxesCombined, ShieldAlert, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ScreenerDataset, ScreenerPresetId } from '../../types/screener'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'

const opportunities: Array<{ id: ScreenerPresetId; label: string; description: string; icon: typeof Activity; tone: string }> = [
  { id: 'breakout-volume', label: 'MA20 突破', description: '價格站上月線，且成交量與動能同步改善。', icon: ChartNoAxesCombined, tone: 'text-red-300 bg-red-400/10 border-red-400/20' },
  { id: 'macd-golden-cross', label: 'MACD 黃金交叉', description: '近期出現黃金交叉，價格仍守在月線之上。', icon: Activity, tone: 'text-brand-300 bg-brand-400/10 border-brand-400/20' },
  { id: 'institution-technical', label: '法人同步', description: '法人買超與技術結構方向一致。', icon: UsersRound, tone: 'text-blue-300 bg-blue-400/10 border-blue-400/20' },
  { id: 'high-risk-warning', label: '高風險提醒', description: '過熱、高波動或跌破均線等需留意條件。', icon: ShieldAlert, tone: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
]

export function TechnicalScreenerPreview({ dataset, loading }: { dataset: ScreenerDataset | null; loading: boolean }) {
  const navigate = useNavigate()
  return <section aria-labelledby="technical-opportunities-title" className="space-y-4">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">盤後技術條件</p><h2 id="technical-opportunities-title" className="type-section-title mt-2 font-semibold text-white">技術機會</h2><p className="mt-2 text-sm text-slate-500">快速找到今天出現關鍵技術變化的股票。</p></div><Button variant="ghost" onClick={() => navigate('/screener')} icon={<ArrowRight size={16}/>}>開啟智慧選股</Button></header>
    {loading && !dataset ? <Card><LoadingState rows={3}/></Card> : !dataset ? <Card state="error"><EmptyState title="技術名單暫時無法讀取" description="市場導覽仍可使用，資料恢復後會自動顯示。"/></Card> : (
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">{opportunities.map((opportunity) => {
        const summary = dataset.presets.find((item) => item.presetId === opportunity.id)
        const matches = dataset.results.filter((item) => item.presetId === opportunity.id && item.matched).sort((a, b) => a.rank - b.rank)
        const Icon = opportunity.icon
        return <button type="button" key={opportunity.id} onClick={() => navigate(`/screener?preset=${opportunity.id}`)} className="panel card-interactive min-h-[210px] min-w-0 p-5 text-left sm:p-6" aria-label={`查看${opportunity.label}選股`}>
          <div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl border ${opportunity.tone}`}><Icon size={20}/></span><span className="mono text-3xl font-semibold text-white">{summary?.matchedCount ?? matches.length}</span></div>
          <h3 className="mt-5 text-base font-semibold text-white">{opportunity.label}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{opportunity.description}</p>
          <div className="mt-4 flex min-w-0 items-center justify-between gap-2"><div className="flex min-w-0 gap-1.5">{matches.slice(0, 2).map((row) => <Badge key={row.symbol} tone="neutral">{row.symbol}</Badge>)}</div><ArrowRight className="shrink-0 text-slate-600" size={16}/></div>
        </button>
      })}</div>
    )}
    {dataset && <p className="text-xs text-slate-600">資料日 {dataset.tradeDate ?? '尚未取得'} · 目前分析 {dataset.sampleCount} 檔實際樣本 · 固定規則判讀，不構成投資建議。</p>}
  </section>
}
