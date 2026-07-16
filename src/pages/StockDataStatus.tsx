import { Database, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable, NumericCell } from '../components/ui/DataTable'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { repositoryHub } from '../repositories/RepositoryHub'
import type { OfficialStockDailyRecord, OfficialStockDatasetStatus } from '../types/officialStockData'

export function StockDataStatus() {
  const [status, setStatus] = useState<OfficialStockDatasetStatus | null>(null)
  const [records, setRecords] = useState<OfficialStockDailyRecord[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const load = async (force = false) => { setLoading(true); if (force) await repositoryHub.stocks.refreshOfficialData(); const [nextStatus, nextRecords] = await Promise.all([repositoryHub.stocks.getOfficialDatasetStatus(), repositoryHub.stocks.getOfficialStocks().catch(() => [])]); setStatus(nextStatus); setRecords(nextRecords); setLoading(false) }
  useEffect(() => { void load() }, [])
  const filtered = useMemo(() => records.filter((record) => record.symbol.includes(query) || record.name.includes(query)).slice(0, 20), [query, records])
  return <div className="space-y-8"><SectionHeader eyebrow="TWSE STOCK DATA" title="上市個股資料狀態" description="網站只讀取排程產生的靜態 JSON，不會由瀏覽器直接呼叫 TWSE。" action={<Button onClick={() => void load(true)} disabled={loading} icon={<RefreshCw size={17} />}>重新讀取 JSON</Button>} />
    {loading ? <div className="panel p-5"><LoadingState rows={7} /></div> : !status?.available ? <div className="panel"><EmptyState title="正式個股資料不可用" description={status?.warnings[0] ?? '請執行資料同步；既有個股頁仍會安全使用 Mock。'} /></div> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[{ label: '交易日期', value: status.tradeDate }, { label: '抓取時間', value: status.fetchedAt?.replace('T', ' ').slice(0, 19) }, { label: '有效紀錄', value: status.recordCount.toLocaleString() }, { label: '資料狀態', value: status.status }, { label: 'Stale', value: status.stale ? '是' : '否' }].map((item) => <Metric key={item.label} label={item.label} value={item.value ?? '—'} />)}</div>
      <Card title="商品類型分布" eyebrow="INSTRUMENTS"><div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-5 sm:p-6">{Object.entries(status.instrumentCounts).map(([name, count]) => <Metric key={name} label={name} value={count.toLocaleString()} />)}</div></Card>
      <Card title="最近 20 筆上市股票" eyebrow="VALID OFFICIAL STOCKS" action={<label><span className="sr-only">搜尋股票</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="代號或名稱" className="min-h-11 rounded-xl border border-white/[.08] bg-black/20 px-3 text-[15px] text-white outline-none focus:border-brand-400/40" /></label>}>
        <div className="hidden md:block"><DataTable minWidth={820} containerClassName="rounded-none border-0"><thead><tr><th>股票</th><th className="numeric">收盤</th><th className="numeric">漲跌</th><th className="numeric">成交股數</th><th className="numeric">成交金額</th><th>狀態</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.symbol}><td><p className="text-base font-semibold text-white">{record.name}</p><p className="mono mt-1 text-sm text-slate-500">{record.symbol}</p></td><NumericCell>{record.close ?? '—'}</NumericCell><NumericCell><Change value={record.change} /></NumericCell><NumericCell>{record.tradeVolume?.toLocaleString() ?? '—'}</NumericCell><NumericCell>{record.tradeValue?.toLocaleString() ?? '—'}</NumericCell><td><Badge tone={record.status === 'official' ? 'brand' : 'warning'}>{record.status}</Badge></td></tr>)}</tbody></DataTable></div>
        <div className="space-y-4 p-4 md:hidden">{filtered.map((record) => <article key={record.symbol} className="mobile-data-card"><div className="flex items-start justify-between gap-3"><div><p className="text-base font-semibold text-white">{record.name}</p><p className="mono mt-1 text-sm text-slate-400">{record.symbol}</p></div><Badge tone={record.status === 'official' ? 'brand' : 'warning'}>{record.status}</Badge></div><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="收盤" value={record.close?.toLocaleString() ?? '—'} /><Metric label="漲跌" valueElement={<Change value={record.change} />} /><Metric label="成交股數" value={record.tradeVolume?.toLocaleString() ?? '—'} /><Metric label="成交金額" value={record.tradeValue?.toLocaleString() ?? '—'} /></div></article>)}</div>
      </Card>
      <Card title="Warnings" eyebrow="DATA QUALITY" variant="compact"><div className="space-y-3 p-5 sm:p-6">{status.warnings.map((warning) => <p key={warning} className="rounded-xl border border-amber-400/15 bg-amber-400/[.04] p-4 text-sm leading-6 text-amber-200">{warning}</p>)}</div></Card>
      <div className="panel flex items-center gap-3 p-5 text-sm leading-6 text-slate-400"><Database size={18} />來源：TWSE 官方 OpenAPI；非即時行情，資料可能因排程延遲而較晚更新。</div>
    </>}
  </div>
}

function Metric({ label, value, valueElement }: { label: string; value?: string; valueElement?: React.ReactNode }) { return <div className="rounded-xl border border-white/[.06] p-4"><p className="text-sm text-slate-400">{label}</p><div className="mono mt-2 text-base font-medium text-white">{valueElement ?? value}</div></div> }
function Change({ value }: { value: number | null }) { if (value === null) return <span className="text-slate-400">—</span>; return <span className={`text-base ${value > 0 ? 'text-red-300' : value < 0 ? 'text-emerald-300' : 'text-slate-300'}`}>{value > 0 ? '↑ +' : value < 0 ? '↓ ' : '— '}{value.toLocaleString()}</span> }
