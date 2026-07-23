import { AlertTriangle, CheckCircle2, Clock3, Database } from 'lucide-react'
import type { StockAnalysisData } from '../../hooks/useStockAnalysisData'
import { Badge } from '../ui/Badge'

export function StockAnalysisDataGuard({ data }: { data: StockAnalysisData }) {
  const tone = data.status === 'success' && !data.stale ? 'brand' : data.status === 'error' ? 'warning' : 'info'
  const Icon = data.status === 'success' && !data.stale ? CheckCircle2 : data.stale ? Clock3 : data.status === 'error' ? AlertTriangle : Database
  return <section className="rounded-2xl border border-white/[.07] bg-white/[.02] px-4 py-3" aria-label="個股資料可信度">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3"><Icon size={18} className="mt-0.5 shrink-0 text-brand-300"/><div className="min-w-0"><p className="text-sm font-medium text-white">資料可信度：{data.status === 'success' ? '核心資料已就緒' : data.status === 'partial' ? '部分資料可用' : data.status === 'error' ? '核心資料讀取失敗' : '讀取中'}</p><p className="mt-1 text-xs leading-5 text-slate-500">行情、歷史與法人欄位來自 TWSE 官方盤後資料；技術、Decision、Snapshot 與產業強度為固定規則推導，Health 仍含模擬因子。</p></div></div>
      <div className="flex shrink-0 flex-wrap gap-2"><Badge tone={tone}>{data.status.toUpperCase()}</Badge><Badge tone={data.dateConsistency.mismatched ? 'warning' : 'neutral'}>{data.dateConsistency.mismatched ? '日期不一致' : '日期已檢查'}</Badge>{data.stale && <Badge tone="warning">Stale</Badge>}</div>
    </div>
    {(data.errors.length > 0 || data.warnings.length > 0) && <details className="mt-3 border-t border-white/[.05] pt-3 text-xs text-slate-500"><summary className="min-h-11 cursor-pointer py-3 text-amber-200">查看資料警示（{data.errors.length + data.warnings.length}）</summary><ul className="space-y-1 pb-2">{[...data.errors, ...data.warnings].map((warning) => <li key={warning}>• {warning}</li>)}</ul></details>}
  </section>
}
