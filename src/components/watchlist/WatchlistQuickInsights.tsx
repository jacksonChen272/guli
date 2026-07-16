import { Activity, ArrowDownRight, ArrowUpRight, Database, Gauge, ShieldAlert } from 'lucide-react'
import { formatComparison, formatConfidence } from '../../lib/formatters'
import type { WatchlistDashboardData } from '../../types/watchlistDashboard'
import { Card } from '../ui/Card'

export function WatchlistQuickInsights({ data }: { data: WatchlistDashboardData }) {
  const movers = [...data.rows].filter((row) => row.decisionChange !== null)
  const decisionUp = [...movers].sort((a, b) => (b.decisionChange ?? 0) - (a.decisionChange ?? 0))[0]
  const decisionDown = [...movers].sort((a, b) => (a.decisionChange ?? 0) - (b.decisionChange ?? 0))[0]
  const lowestConfidence = [...data.rows].sort((a, b) => a.confidence - b.confidence)[0]
  const snapshotMover = [...data.rows].filter((row) => row.snapshotChange !== null).sort((a, b) => Math.abs(b.snapshotChange ?? 0) - Math.abs(a.snapshotChange ?? 0))[0]
  const insights = [
    { label: 'Decision 提升最多', value: decisionUp ? `${decisionUp.symbol} ${formatComparison(decisionUp.decisionChange)}` : '尚無比較資料', icon: ArrowUpRight },
    { label: 'Decision 下降最多', value: decisionDown ? `${decisionDown.symbol} ${formatComparison(decisionDown.decisionChange)}` : '尚無比較資料', icon: ArrowDownRight },
    { label: 'Confidence 最低', value: lowestConfidence ? `${lowestConfidence.symbol} ${formatConfidence(lowestConfidence.confidence)}` : '—', icon: Gauge },
    { label: 'Snapshot 變化最大', value: snapshotMover ? `${snapshotMover.symbol} ${formatComparison(snapshotMover.snapshotChange)}` : '尚無比較資料', icon: Activity },
    { label: '高風險數', value: `${data.summary.highRiskCount} 檔`, icon: ShieldAlert },
    { label: '官方資料覆蓋率', value: `${data.summary.officialCoverageRate}%`, icon: Database },
  ]
  return <Card title="快速洞察" eyebrow="AT-A-GLANCE" variant="compact"><div className="grid gap-px bg-[var(--border-subtle)] sm:grid-cols-2 xl:grid-cols-6">{insights.map(({ label, value, icon: Icon }) => <div key={label} className="bg-[var(--bg-card)] p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Icon size={17} className="text-brand-300" />{label}</div><p className="mono mt-3 text-base font-medium text-white">{value}</p></div>)}</div></Card>
}
