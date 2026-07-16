import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Gauge, ShieldAlert, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatComparison, formatConfidence, formatDecisionScore } from '../../lib/formatters'
import { useWatchlistDashboard } from '../../hooks/useWatchlistDashboard'
import type { WatchlistDashboardRow } from '../../types/watchlistDashboard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'
import { WatchlistDetailDrawer } from '../watchlist/WatchlistDetailDrawer'

export function WatchlistDashboardPreview() {
  const navigate = useNavigate()
  const { data, loading } = useWatchlistDashboard()
  const [selected, setSelected] = useState<WatchlistDashboardRow | null>(null)
  const best = data?.bestCandidates[0]
  const risk = data?.riskRanking[0]
  const alert = data?.alerts[0]
  const alertRow = alert ? data?.rows.find((row) => row.symbol === alert.symbol) : undefined
  const averageRow = data?.bestCandidates[0]
  const up = data ? [...data.rows].filter((row) => row.decisionChange !== null).sort((a, b) => (b.decisionChange ?? 0) - (a.decisionChange ?? 0))[0] : undefined
  const down = data ? [...data.rows].filter((row) => row.decisionChange !== null).sort((a, b) => (a.decisionChange ?? 0) - (b.decisionChange ?? 0))[0] : undefined
  const lowest = data ? [...data.rows].sort((a, b) => a.confidence - b.confidence)[0] : undefined
  const snapshot = data ? [...data.rows].filter((row) => row.snapshotChange !== null).sort((a, b) => Math.abs(b.snapshotChange ?? 0) - Math.abs(a.snapshotChange ?? 0))[0] : undefined
  return <>
    <Card title="我的自選股摘要" eyebrow="SMART OBSERVATION" variant="compact" action={<Button variant="ghost" onClick={() => navigate('/watchlist')} icon={<ArrowRight size={16} />}>觀察中心</Button>}>
      {loading || !data ? <LoadingState rows={3} /> : <>
        <div className="grid gap-px bg-[var(--border-subtle)] sm:grid-cols-2 xl:grid-cols-4">
          <PreviewKpi label="今日最佳" icon={<Sparkles size={17} />} row={best} value={best ? formatDecisionScore(best.decisionScore) : '—'} detail={best?.topPositiveFactors[0]?.name ?? '尚無候選'} onSelect={setSelected} />
          <PreviewKpi label="最高風險" icon={<ShieldAlert size={17} />} row={risk} value={risk ? `${risk.riskScore}` : '—'} detail={risk?.topNegativeFactors[0]?.name ?? risk?.risks[0]?.title ?? '尚無風險'} onSelect={setSelected} />
          <PreviewKpi label="平均 Decision" icon={<Gauge size={17} />} row={averageRow} value={formatDecisionScore(data.summary.averageDecision)} detail={`官方覆蓋 ${data.summary.officialCoverageRate}%`} onSelect={setSelected} />
          <PreviewKpi label="今日提醒" icon={<AlertTriangle size={17} />} row={alertRow} value={`${data.alerts.length}`} detail={alert?.title ?? '目前無重大提醒'} onSelect={setSelected} />
        </div>
        <div className="grid gap-2 border-t border-[var(--border-subtle)] p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Insight label="Decision 上升最多" value={up ? `${up.symbol} ${formatComparison(up.decisionChange)}` : '尚無前期資料'} icon={<ArrowUpRight size={15} />} />
          <Insight label="Decision 下降最多" value={down ? `${down.symbol} ${formatComparison(down.decisionChange)}` : '尚無前期資料'} icon={<ArrowDownRight size={15} />} />
          <Insight label="Confidence 最低" value={lowest ? `${lowest.symbol} ${formatConfidence(lowest.confidence)}` : '—'} icon={<Gauge size={15} />} />
          <Insight label="Snapshot 變化最大" value={snapshot ? `${snapshot.symbol} ${formatComparison(snapshot.snapshotChange)}` : '尚無前期資料'} icon={<Sparkles size={15} />} />
          <Insight label="官方資料覆蓋" value={`${data.summary.officialCoverageRate}%`} icon={<ShieldAlert size={15} />} />
        </div>
      </>}
    </Card>
    <WatchlistDetailDrawer row={selected} onClose={() => setSelected(null)} />
  </>
}

function PreviewKpi({ label, icon, row, value, detail, onSelect }: { label: string; icon: React.ReactNode; row?: WatchlistDashboardRow; value: string; detail: string; onSelect: (row: WatchlistDashboardRow) => void }) {
  const content = <><div className="flex items-center justify-between gap-2 text-sm text-slate-400"><span className="flex items-center gap-2">{icon}{label}</span>{row && <span className="mono text-xs text-slate-500">{row.symbol}</span>}</div><p className="mono mt-3 text-[28px] font-semibold leading-none text-white">{value}</p><p className="mt-3 truncate text-sm text-slate-300">{row?.name ?? detail}</p><p className="mt-1 truncate text-xs text-slate-500">{detail} · {row ? `Confidence ${formatConfidence(row.confidence)}` : '無資料'}</p><p className="mt-2 text-xs text-slate-500">較昨日：{row ? formatComparison(row.decisionChange) : '尚無前期資料'}</p></>
  return row ? <button type="button" onClick={() => onSelect(row)} className="min-h-[150px] bg-[var(--bg-card)] p-4 text-left hover:bg-white/[.025] sm:p-5">{content}</button> : <div className="min-h-[150px] bg-[var(--bg-card)] p-4 sm:p-5">{content}</div>
}
function Insight({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl border border-white/[.05] px-3 py-2"><p className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</p><p className="mono mt-1 truncate text-sm text-slate-200">{value}</p></div> }
