import { AlertTriangle, ArrowDown, ArrowUp, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { DataTable, NumericCell } from '../components/ui/DataTable'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Select } from '../components/ui/Select'
import { repositoryHub } from '../repositories/RepositoryHub'
import type { StockSnapshotDailyIndex, StockSnapshotRankingCriteria, StockSnapshotStatus } from '../types/stockSnapshot'

const PAGE_SIZE = 25
export function StockSnapshotOverview() {
  const navigate = useNavigate()
  const [data, setData] = useState<StockSnapshotDailyIndex | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<StockSnapshotRankingCriteria>('snapshotScore')
  const [status, setStatus] = useState<'all' | StockSnapshotStatus>('all')
  const [highRisk, setHighRisk] = useState(false)
  const [page, setPage] = useState(1)
  useEffect(() => { repositoryHub.stockSnapshots.getLatestIndex().then(setData).catch((cause) => setError(cause instanceof Error ? cause.message : '快照載入失敗')) }, [])
  const rows = useMemo(() => {
    if (!data) return []
    const term = query.trim().toLowerCase()
    const field = (row: StockSnapshotDailyIndex['records'][number]) => sort === 'snapshotScore' ? row.snapshotScore : sort === 'priceStrength' ? row.priceStrengthScore : sort === 'liquidity' ? row.liquidityScore : sort === 'gainers' || sort === 'losers' ? row.changePercent : sort === 'tradeValue' ? row.tradeValue : row.riskCount
    return data.records.filter((row) => (!term || row.symbol.includes(term) || row.name.toLowerCase().includes(term)) && (status === 'all' || row.status === status) && (!highRisk || row.highRiskCount > 0)).sort((a, b) => sort === 'losers' ? (field(a) ?? Infinity) - (field(b) ?? Infinity) : (field(b) ?? -Infinity) - (field(a) ?? -Infinity))
  }, [data, query, sort, status, highRisk])
  useEffect(() => setPage(1), [query, sort, status, highRisk])
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  return <div className="space-y-8"><SectionHeader eyebrow="OFFICIAL STOCK SNAPSHOTS" title="上市個股快照總覽" description="使用 TWSE 官方盤後價量資料，透過固定規則產生當日快照；不含 ETF、ETN、權證與 unknown。" />
    <Card variant="compact"><div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-[1fr_190px_170px_auto]"><label className="relative"><span className="sr-only">搜尋股票</span><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="輸入股票代號或名稱" className="min-h-11 w-full rounded-xl border border-white/[.08] bg-white/[.02] pl-10 pr-3 text-[15px] text-white outline-none focus:border-brand-400/40" /></label><Select value={sort} onChange={(event) => setSort(event.target.value as StockSnapshotRankingCriteria)} aria-label="排序方式"><option value="snapshotScore">快照分數</option><option value="gainers">漲幅</option><option value="losers">跌幅</option><option value="tradeValue">成交金額</option><option value="liquidity">流動性</option><option value="riskCount">風險數</option></Select><Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="狀態篩選"><option value="all">全部狀態</option>{['強勢', '偏強', '中性', '偏弱', '弱勢', '資料不足'].map((value) => <option key={value}>{value}</option>)}</Select><label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/[.08] px-3 text-sm text-slate-300"><input type="checkbox" checked={highRisk} onChange={(event) => setHighRisk(event.target.checked)} />僅顯示高風險</label></div></Card>
    {error ? <Card state="error"><EmptyState title="無法讀取個股快照" description={error} /></Card> : !data ? <Card state="loading"><LoadingState rows={8} /></Card> : <Card title={`快照排行（${rows.length} 檔）`} eyebrow={`${data.tradeDate} · ${data.recordCount} STOCKS`} action={<div className="flex flex-wrap gap-2"><Badge tone="info">TWSE 官方價量</Badge><Badge tone="brand">規則衍生</Badge></div>}>
      <div className="hidden md:block"><DataTable minWidth={860} containerClassName="rounded-none border-0"><thead><tr><th>排名／股票</th><th className="numeric">快照分數</th><th className="numeric">今日漲跌</th><th className="numeric">成交金額</th><th className="numeric">流動性</th><th>風險</th></tr></thead><tbody>{visible.map((row, index) => <tr key={row.symbol} onClick={() => navigate(`/stock/${row.symbol}`)} className="cursor-pointer"><td><p className="text-base font-semibold text-white">{(page - 1) * PAGE_SIZE + index + 1}. {row.name}</p><p className="mono mt-1 text-sm text-slate-500">{row.symbol} · {row.status}</p></td><NumericCell className="text-lg text-white">{format(row.snapshotScore)}</NumericCell><NumericCell><Change value={row.changePercent} /></NumericCell><NumericCell>{row.tradeValue === null ? '—' : `${(row.tradeValue / 100_000_000).toFixed(2)} 億`}</NumericCell><NumericCell>{format(row.liquidityScore)}</NumericCell><td><Badge tone={row.highRiskCount ? 'warning' : 'neutral'}><AlertTriangle size={14} className="mr-1" />{row.riskCount} 項風險</Badge></td></tr>)}</tbody></DataTable></div>
      <div className="space-y-4 p-4 md:hidden">{visible.map((row, index) => <button type="button" key={row.symbol} onClick={() => navigate(`/stock/${row.symbol}`)} className="mobile-data-card block min-h-0 w-full text-left"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">排名 #{(page - 1) * PAGE_SIZE + index + 1}</p><p className="mt-1 text-base font-semibold text-white">{row.name}</p><p className="mono mt-1 text-sm text-slate-400">{row.symbol}</p></div><Badge tone={row.highRiskCount ? 'warning' : 'neutral'}><AlertTriangle size={13} className="mr-1" />{row.riskCount} 風險</Badge></div><div className="mt-4 grid grid-cols-2 gap-3"><MobileMetric label="快照分數" value={format(row.snapshotScore)} /><MobileMetric label="今日漲跌" valueElement={<Change value={row.changePercent} />} /><MobileMetric label="成交金額" value={row.tradeValue === null ? '—' : `${(row.tradeValue / 100_000_000).toFixed(2)} 億`} /><MobileMetric label="流動性" value={format(row.liquidityScore)} /></div></button>)}</div>
      <div className="flex items-center justify-between border-t border-white/[.06] p-4 sm:px-6"><button className="min-h-11 rounded-xl px-4 text-sm text-slate-300 disabled:opacity-30" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>上一頁</button><span className="text-sm text-slate-400">第 {page}／{pages} 頁 · 每頁 {PAGE_SIZE} 筆</span><button className="min-h-11 rounded-xl px-4 text-sm text-slate-300 disabled:opacity-30" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>下一頁</button></div>
    </Card>}
  </div>
}

function MobileMetric({ label, value, valueElement }: { label: string; value?: string; valueElement?: React.ReactNode }) { return <div className="rounded-xl bg-white/[.025] p-3"><p className="text-xs text-slate-500">{label}</p><div className="mono mt-2 text-base text-white">{valueElement ?? value}</div></div> }
function Change({ value }: { value: number | null }) { if (value === null) return <span className="text-slate-400">—</span>; return <span className={`inline-flex items-center justify-end gap-1 text-base ${value >= 0 ? 'text-red-300' : 'text-emerald-300'}`}>{value >= 0 ? <ArrowUp size={15} /> : <ArrowDown size={15} />}{value > 0 ? '+' : ''}{value.toFixed(2)}%</span> }
const format = (value: number | null) => value === null ? '—' : value.toLocaleString('zh-TW', { maximumFractionDigits: 2 })
