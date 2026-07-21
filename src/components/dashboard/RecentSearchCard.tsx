import { Clock3, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { SearchStockIndexItem } from '../../types/search'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

export function RecentSearchCard({ symbols }: { symbols: string[] }) {
  const navigate = useNavigate()
  const [stocks, setStocks] = useState<SearchStockIndexItem[]>([])
  useEffect(() => {
    let active = true
    void repositoryHub.searchRepository.resolveSymbols(symbols).then((items) => { if (active) setStocks(items) })
    return () => { active = false }
  }, [symbols])
  return <Card className="h-full" title="最近搜尋" eyebrow="RECENT 10" action={symbols.length ? <Button size="sm" variant="ghost" icon={<Trash2 size={14}/>} onClick={() => repositoryHub.searchRepository.clearRecent()}>清除</Button> : undefined}>
    {stocks.length ? <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">{stocks.slice(0, 10).map((stock) => <button key={stock.symbol} type="button" onClick={() => { repositoryHub.searchRepository.recordRecent(stock.symbol); navigate(`/stock/${stock.symbol}`) }} className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.015] px-3 text-left transition hover:border-brand-400/25 hover:bg-brand-400/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"><Clock3 size={15} className="shrink-0 text-brand-300"/><span className="mono text-sm text-white">{stock.symbol}</span><span className="truncate text-xs text-slate-500">{stock.name}</span><Search size={14} className="ml-auto shrink-0 text-slate-600"/></button>)}</div> : <EmptyState title="尚無最近搜尋" description="從全域搜尋中心查看股票後，最近 10 筆會同步保存在此裝置。"/>}
  </Card>
}
