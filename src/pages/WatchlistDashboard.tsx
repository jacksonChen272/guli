import { Database, Plus, RefreshCw, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageErrorState } from '../components/system/PageErrorState'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { LoadingState } from '../components/ui/LoadingState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { WatchlistDashboardCards } from '../components/watchlist/WatchlistDashboardCards'
import { WatchlistDashboardTable } from '../components/watchlist/WatchlistDashboardTable'
import { WatchlistDetailDrawer } from '../components/watchlist/WatchlistDetailDrawer'
import { WatchlistQuickInsights } from '../components/watchlist/WatchlistQuickInsights'
import { WatchlistTodayActions } from '../components/watchlist/WatchlistTodayActions'
import { useWatchlistDashboard } from '../hooks/useWatchlistDashboard'
import { repositoryHub } from '../repositories/RepositoryHub'
import { useWatchlistStore } from '../stores/watchlistStore'
import type { WatchlistDashboardFilters } from '../types/watchlistDashboard'

const initialFilters: WatchlistDashboardFilters = { query: '', minimumDecision: 0, confidence: 'all', source: 'all', risk: 'all', industry: 'all', sort: 'decision' }

export function WatchlistDashboard() {
  const items = useWatchlistStore((state) => state.items)
  const { data, loading, error, reload } = useWatchlistDashboard()
  const [filters, setFilters] = useState(initialFilters)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [addQuery, setAddQuery] = useState('')
  const stocks = repositoryHub.stocks.getSnapshot()
  const addResults = useMemo(() => {
    const query = addQuery.trim().toLowerCase()
    if (!query) return []
    return stocks.filter((stock) => !items.some((item) => item.symbol === stock.symbol) && (stock.symbol.includes(query) || stock.name.toLowerCase().includes(query))).slice(0, 6)
  }, [addQuery, items, stocks])
  const selected = data?.rows.find((row) => row.symbol === selectedSymbol) ?? null
  if (error) return <PageErrorState title="智慧觀察中心暫時無法顯示" description={error} />
  return <div className="space-y-8">
    <SectionHeader eyebrow="GULI SMART WATCHLIST · v0.7.2" title="智慧自選股" description="整合 Decision、健康分數、Stock Snapshot、Confidence 與風險規則的每日觀察工作台。" action={<Button variant="ghost" onClick={reload} icon={<RefreshCw size={16} />}>重新讀取</Button>} />

    <Card variant="compact"><div className="grid gap-5 p-5 lg:grid-cols-[auto_1fr] lg:items-center lg:p-6"><div className="flex flex-wrap gap-3"><Status label="自選股數量" value={`${data?.summary.stockCount ?? items.length} 檔`} /><Status label="最後更新" value={data?.tradeDate ?? '讀取中'} /><Status label="官方資料覆蓋率" value={`${data?.summary.officialCoverageRate ?? 0}%`} icon={<Database size={15} />} /></div><div className="relative lg:justify-self-end lg:w-full lg:max-w-md"><label className="relative block"><span className="sr-only">快速加入股票</span><Search className="absolute left-3 top-3.5 text-slate-400" size={17} /><input value={addQuery} onChange={(event) => setAddQuery(event.target.value)} placeholder="快速加入股票代號或名稱" className="h-11 w-full rounded-xl border border-white/[.08] bg-[#0d1317] pl-10 pr-3 text-[15px] text-white outline-none focus:border-brand-400/40" /></label>{addResults.length > 0 && <div className="absolute inset-x-0 top-[52px] z-20 overflow-hidden rounded-xl border border-white/[.08] bg-[#10171c] shadow-2xl">{addResults.map((stock) => <button type="button" key={stock.symbol} onClick={() => { repositoryHub.watchlist.add(stock.symbol); setAddQuery('') }} className="flex min-h-12 w-full items-center justify-between border-b border-white/[.04] px-4 text-left text-sm hover:bg-white/[.04]"><span className="text-white">{stock.name} <span className="mono text-slate-400">{stock.symbol}</span></span><span className="flex items-center gap-1 text-brand-300"><Plus size={16} />加入</span></button>)}</div>}<p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Star size={13} />清單變更後會由既有 Repository 更新快取。</p></div></div></Card>

    {loading || !data ? <div className="panel"><LoadingState rows={8} /></div> : <>
      <section className="space-y-5"><div><p className="eyebrow">DAILY WORKBENCH</p><h2 className="type-section-title mt-2 font-semibold text-white">今日工作台</h2></div><WatchlistDashboardCards data={data} onSelect={(row) => setSelectedSymbol(row.symbol)} /></section>
      <WatchlistQuickInsights data={data} />
      <WatchlistTodayActions actions={data.actions} rows={data.rows} onSelect={(row) => setSelectedSymbol(row.symbol)} />
      <WatchlistDashboardTable rows={data.rows} filters={filters} onFiltersChange={setFilters} onSelect={(row) => setSelectedSymbol(row.symbol)} onRemove={(symbol) => { repositoryHub.watchlist.remove(symbol); if (selectedSymbol === symbol) setSelectedSymbol(null) }} />
      {data.warnings.length > 0 && <Card title="資料提醒" eyebrow="DATA WARNINGS" variant="compact"><ul className="space-y-2 p-5">{data.warnings.map((warning) => <li key={warning} className="text-sm text-amber-200/90">• {warning}</li>)}</ul></Card>}
      <WatchlistDetailDrawer row={selected} onClose={() => setSelectedSymbol(null)} />
    </>}
    <Disclaimer>Observation Status、Watchlist Score 與 Today Action 僅反映既有資料及固定規則，不構成投資建議或買賣指示。</Disclaimer>
  </div>
}

function Status({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="min-w-[132px] rounded-xl border border-white/[.06] bg-white/[.018] px-4 py-3"><p className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</p><p className="mono mt-1 text-base font-medium text-white">{value}</p></div> }
