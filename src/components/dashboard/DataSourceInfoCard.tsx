import { AlertTriangle, ChevronDown, Clock3, Database, HardDrive, Layers3, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formulaVersion } from '../../config/decisionFormula'
import { formatDate, formatDateTime } from '../../lib/formatters'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { OfficialStockDatasetStatus } from '../../types/officialStockData'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type SnapshotStatus = { market: string; stock: string }

export function DataSourceInfoCard({ onReload }: { onReload?: () => void }) {
  const [, setRevision] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stockStatus, setStockStatus] = useState<OfficialStockDatasetStatus | null>(null)
  const [snapshots, setSnapshots] = useState<SnapshotStatus>({ market: '讀取中', stock: '讀取中' })
  const status = repositoryHub.getPlatformStatus()
  const official = status.official
  const loadStatus = async (force = false) => {
    if (force) await repositoryHub.stocks.refreshOfficialData()
    const [stocks, marketSnapshot, stockSnapshot] = await Promise.all([
      repositoryHub.stocks.getOfficialDatasetStatus(),
      repositoryHub.snapshots.getLatest().catch(() => null),
      repositoryHub.stockSnapshots.getLatestIndex().catch(() => null),
    ])
    setStockStatus(stocks)
    setSnapshots({ market: marketSnapshot ? `${formatDate(marketSnapshot.tradeDate)} 可用` : '無資料', stock: stockSnapshot ? `${stockSnapshot.recordCount.toLocaleString()} 筆` : '無資料' })
  }
  useEffect(() => { void loadStatus() }, [])
  const reload = async () => { setLoading(true); await Promise.all([repositoryHub.refreshMarket(), loadStatus(true)]); setLoading(false); setRevision((value) => value + 1); onReload?.() }
  const warnings = [...(official?.warnings ?? []), ...(stockStatus?.warnings ?? []), ...status.quality.issues]
  const stale = Boolean(stockStatus?.stale || warnings.some((warning) => /stale|過期|非最新/i.test(warning)))
  const items = [
    { icon: Database, label: 'Provider', value: status.provider.id === 'twse' ? 'TWSE Official' : 'Mock' },
    { icon: Clock3, label: '市場交易日', value: formatDate(official?.tradeDate) },
    { icon: Database, label: '個股資料', value: stockStatus?.available ? `${stockStatus.status === 'official' ? '官方' : '部分'} ${formatDate(stockStatus.tradeDate)}` : 'Mock／未載入' },
    { icon: Layers3, label: 'Snapshot', value: `${snapshots.market} · ${snapshots.stock}` },
    { icon: ShieldCheck, label: 'Decision 公式', value: formulaVersion },
    { icon: HardDrive, label: 'Cache', value: status.cache },
    { icon: AlertTriangle, label: 'Stale／警示', value: `${stale ? '可能過期' : '正常'} · ${warnings.length} 項` },
  ]
  return <Card eyebrow="DATA PLATFORM" title="資料平台狀態" variant="compact" action={<Button size="sm" variant="ghost" disabled={loading} onClick={() => void reload()} icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>重新讀取</Button>}>
    <div className="hidden grid-cols-2 gap-px bg-[var(--border-subtle)] sm:grid lg:grid-cols-4 2xl:grid-cols-7">{items.map(({ icon: Icon, label, value }) => <StatusItem key={label} icon={<Icon size={14} />} label={label} value={value} />)}</div>
    <details className="group sm:hidden"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-slate-200"><span>{items[0].value} · {items[1].value}</span><ChevronDown size={18} className="transition-transform group-open:rotate-180" /></summary><div className="grid grid-cols-2 gap-px border-t border-[var(--border-subtle)] bg-[var(--border-subtle)]">{items.map(({ icon: Icon, label, value }) => <StatusItem key={label} icon={<Icon size={14} />} label={label} value={value} />)}</div></details>
    <details className="group border-t border-[var(--border-subtle)]"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm text-slate-400 sm:px-5"><span>資料品質 {status.quality.score} · {status.quality.grade} · 更新 {formatDateTime(status.updatedAt)}</span><span className="flex items-center gap-1 text-xs text-amber-200/80">{warnings.length ? `${warnings.length} 項警示` : '無警示'}<ChevronDown size={15} className="transition-transform group-open:rotate-180" /></span></summary><div className="border-t border-[var(--border-subtle)] px-4 py-3 text-sm leading-6 text-amber-200/80 sm:px-5">{warnings.length ? warnings.map((warning) => <p key={warning}>• {warning}</p>) : <p className="text-slate-500">目前沒有資料品質警示；法人與技術指標仍保留 Mock／derived 來源標示。</p>}</div></details>
  </Card>
}

function StatusItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="min-w-0 bg-[var(--bg-card)] px-4 py-3"><p className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</p><p className="mt-1.5 truncate text-sm font-medium text-slate-200" title={value}>{value}</p></div> }
