import { Clock3, Database, HardDrive, Radio, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function DataSourceInfoCard({ onReload }: { onReload?: () => void }) {
  const [, setRevision] = useState(0)
  const [loading, setLoading] = useState(false)
  const status = repositoryHub.getPlatformStatus()
  const official = status.official
  const reload = async () => { setLoading(true); await repositoryHub.refreshMarket(); setLoading(false); setRevision((value) => value + 1); onReload?.() }
  const items = [
    { icon: Database, label: 'Provider', value: status.provider.id === 'twse' ? 'TWSE' : 'Mock' },
    { icon: Radio, label: '市場資料狀態', value: official?.status === 'official' ? '官方完整資料' : official?.status === 'partial' ? '官方部分資料' : official?.status === 'fallback' ? '已回退模擬資料' : '模擬資料' },
    { icon: Clock3, label: '交易日期', value: official?.tradeDate ?? '模擬資料日期' },
    { icon: Clock3, label: '抓取時間', value: (official?.fetchedAt ?? status.updatedAt).replace('T', ' ').slice(0, 16) },
    { icon: ShieldCheck, label: '資料品質', value: `${status.quality.grade} · ${status.quality.score} 分` },
    { icon: HardDrive, label: 'Cache', value: status.cache === 'hit' ? '命中' : status.cache === 'stale' ? '過期' : '新讀取' },
    { icon: TriangleAlert, label: 'Stale', value: status.quality.issues.some((issue) => issue.includes('合理交易日')) ? '是' : '否' },
  ]
  const warnings = official?.warnings ?? []
  return <Card eyebrow="DATA PLATFORM" title="資料來源資訊" action={<Button size="sm" variant="ghost" disabled={loading} onClick={() => void reload()} icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>}>重新讀取 JSON</Button>}>
    <div className="grid gap-px bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{items.map(({ icon: Icon, label, value }) => <div key={label} className="bg-[var(--bg-card)] px-4 py-4"><div className="mb-2 flex items-center gap-2 text-[9px] text-slate-500"><Icon size={12}/>{label}</div><p className="truncate text-[11px] font-medium text-slate-200" title={value}>{value}</p></div>)}</div>
    <div className="border-t border-[var(--border-subtle)] px-5 py-3 text-[10px] leading-5 text-amber-200/70">{warnings.length ? warnings.map((warning) => <p key={warning}>• {warning}</p>) : <p>目前部分欄位已接入 TWSE 官方盤後資料，其餘欄位仍為模擬資料。</p>}</div>
  </Card>
}
