import { ArrowRight, CheckCircle2, Database, History, Landmark } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { TodayCoverage } from '../../hooks/useTodayDashboardData'
import { formatDateTime } from '../../lib/formatters'
import type { DataPlatformStatus } from '../../types/dataPlatformStatus'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'

export function DataCoverageSummary({ coverage, platform, loading }: { coverage: TodayCoverage; platform: DataPlatformStatus | null; loading: boolean }) {
  const navigate = useNavigate()
  const total = Math.max(coverage.totalCommonStocks, 1)
  const items = [
    { label: '市場行情', value: platform?.market === 'Official' ? 100 : 0, detail: platform?.market === 'Official' ? '證交所盤後資料已接上' : '目前使用備援資料', icon: Landmark },
    { label: '個股盤後', value: percent(coverage.officialStockCount, total), detail: `${coverage.officialStockCount.toLocaleString('zh-TW')} 檔官方行情`, icon: Database },
    { label: '技術分析', value: percent(coverage.technicalStockCount, total), detail: `${coverage.technicalStockCount.toLocaleString('zh-TW')} / ${coverage.totalCommonStocks.toLocaleString('zh-TW')} 檔`, icon: CheckCircle2 },
    { label: '歷史資料', value: percent(coverage.historyStockCount, total), detail: `${coverage.historyStockCount.toLocaleString('zh-TW')} 檔可分析`, icon: History },
  ]
  return <footer aria-label="資料完整度">
    <Card title="資料完整度" eyebrow="你正在看到哪些資料" action={<Button variant="ghost" onClick={() => navigate('/data-coverage')} icon={<ArrowRight size={16}/>}>查看完整說明</Button>}>
      {loading && !platform ? <LoadingState rows={3}/> : <div className="grid gap-px bg-white/[.06] sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <CoverageItem key={item.label} {...item}/>)}</div>}
      <div className="flex flex-col gap-2 border-t border-white/[.06] px-5 py-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>市場與個股行情來自證交所盤後資料；技術判讀與推薦名單由固定規則計算。</p>
        <div className="flex flex-wrap items-center gap-2"><Badge tone="info">法人 {coverage.institutionalStockCount.toLocaleString('zh-TW')} 檔</Badge><span>更新 {formatDateTime(coverage.updatedAt)}</span></div>
      </div>
    </Card>
  </footer>
}

function CoverageItem({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof Database }) {
  return <div className="min-w-0 bg-[var(--bg-card)] p-5"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-400/[.08] text-brand-300"><Icon size={17}/></span><span className="mono text-lg font-semibold text-white">{value}%</span></div><p className="mt-4 text-sm font-semibold text-slate-200">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.05]" role="progressbar" aria-label={`${label}覆蓋率`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand-400/80" style={{ width: `${value}%` }}/></div></div>
}
const percent = (value: number, total: number) => Math.max(0, Math.min(100, Math.round(value / total * 100)))
