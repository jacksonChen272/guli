import { Clock3, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

const stockNames = new Map(repositoryHub.stocks.getSnapshot().map((stock) => [stock.symbol, stock.name]))

export function RecentSearchCard({ symbols }: { symbols: string[] }) {
  const navigate = useNavigate()
  return <Card className="h-full" title="最近搜尋" eyebrow="RECENT 10" action={symbols.length ? <Button size="sm" variant="ghost" icon={<Trash2 size={14}/>} onClick={() => repositoryHub.recentSearch.clear()}>清除</Button> : undefined}>
    {symbols.length ? <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">{symbols.slice(0, 10).map((symbol) => <button key={symbol} type="button" onClick={() => { repositoryHub.recentSearch.record(symbol); navigate(`/stock/${symbol}`) }} className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.015] px-3 text-left transition hover:border-brand-400/25 hover:bg-brand-400/[.04]"><Clock3 size={15} className="shrink-0 text-brand-300"/><span className="mono text-sm text-white">{symbol}</span><span className="truncate text-xs text-slate-500">{stockNames.get(symbol) ?? '個股分析'}</span><Search size={14} className="ml-auto shrink-0 text-slate-600"/></button>)}</div> : <EmptyState title="尚無最近搜尋" description="從上方搜尋框查看股票後，最近 10 筆會保存在此裝置。"/>}
  </Card>
}

