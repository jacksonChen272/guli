import { ChevronDown, MessageSquareText, ShieldCheck } from 'lucide-react'
import type { TodaySummaryResult } from '../../types/dashboardIntelligence'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'

export function TodaySummaryCard({ summary, loading }: { summary: TodaySummaryResult; loading: boolean }) {
  return <Card className="h-full min-w-0" title="今日市場摘要" eyebrow="FIXED RULE SUMMARY" action={<Badge tone="info">today-summary-v1.0</Badge>}>
    {loading && summary.stance === 'unknown' ? <LoadingState rows={4}/> : <div className="p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[.07] text-brand-300"><MessageSquareText size={20}/></span><div className="min-w-0"><p className="text-lg font-semibold leading-8 text-white sm:text-xl">{summary.text}</p><div className="mt-4 flex flex-wrap gap-2">{summary.tags.map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}</div></div></div>
      <details className="group mt-5 rounded-xl border border-white/[.06] bg-white/[.015] px-4 py-3"><summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm text-slate-300"><ShieldCheck size={15} className="text-brand-300"/>查看規則依據<ChevronDown size={15} className="ml-auto transition-transform group-open:rotate-180"/></summary><ul className="mt-3 space-y-2 border-t border-white/[.05] pt-3">{summary.reasons.map((reason) => <li key={reason} className="text-xs leading-5 text-slate-500">• {reason}</li>)}</ul></details>
      <p className="mt-4 text-xs text-slate-600">資料日期 {summary.tradeDate ?? '尚未取得'} · 全文由固定規則產生，不使用生成式 AI。</p>
    </div>}
  </Card>
}

