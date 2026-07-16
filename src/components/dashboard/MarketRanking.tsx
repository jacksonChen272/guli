import { Award } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OfficialMarketOverview, OfficialMarketRankingItem } from '../../types/marketData'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { Tabs } from '../ui/Tabs'

type RankingTab = 'tradingAmount' | 'tradingVolume' | 'gainers' | 'losers'

const tabs = [
  { value: 'tradingAmount' as const, label: '成交值' },
  { value: 'tradingVolume' as const, label: '成交量' },
  { value: 'gainers' as const, label: '漲幅' },
  { value: 'losers' as const, label: '跌幅' },
]

const displayValue = (tab: RankingTab, item: OfficialMarketRankingItem) => {
  if (tab === 'tradingAmount') return `${(item.tradingAmount / 100_000_000).toFixed(1)} 億`
  if (tab === 'tradingVolume') return `${(item.tradingVolume / 10_000_000).toFixed(1)} 萬張`
  return `${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`
}

export function MarketRanking({ data }: { data?: OfficialMarketOverview }) {
  const [tab, setTab] = useState<RankingTab>('tradingAmount')
  const navigate = useNavigate()
  const items = data?.rankings[tab] ?? []
  const values = items.map((item) => tab === 'tradingAmount' ? item.tradingAmount : tab === 'tradingVolume' ? item.tradingVolume : Math.abs(item.changePercent))
  const max = Math.max(...values, 1)
  return <Card className="h-full" title="TWSE 上市股票排行" eyebrow="OFFICIAL RANKING" action={<Badge tone={data?.status === 'official' ? 'brand' : 'info'}>{data?.status === 'official' ? 'TWSE Official' : 'TWSE 部分資料'}</Badge>}>
    <div className="overflow-x-auto border-b border-[var(--border-subtle)] p-3"><Tabs value={tab} onChange={setTab} options={tabs}/></div>
    {items.length ? <div key={tab} className="page-enter max-h-[616px] overflow-y-auto p-3">{items.map((item, index) => {
      const up = item.change >= 0
      const value = values[index]
      return <button type="button" key={item.symbol} onClick={() => navigate(`/stock/${item.symbol}`)} className="group grid min-h-[58px] w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 text-left hover:bg-white/[.025]">
        <span className={`mono grid h-6 w-6 place-items-center rounded-md text-[9px] ${index < 3 ? 'bg-brand-400/[.08] text-brand-300' : 'text-slate-700'}`}>{index < 3 ? <Award size={12}/> : String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0"><p className="truncate text-[11px] text-slate-300 group-hover:text-white">{item.symbol} {item.name}</p><p className="mono mt-1 text-[9px] text-slate-600">收盤 {item.close.toLocaleString('zh-TW')} · {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%</p></div>
        <div className="min-w-[76px] text-right"><span className={`mono text-[10px] ${up ? 'text-red-400' : 'text-emerald-400'}`}>{displayValue(tab, item)}</span><div className="mt-1.5 ml-auto h-0.5 w-14 overflow-hidden rounded-full bg-white/[.04]"><div className={up ? 'h-full bg-red-400/60' : 'h-full bg-emerald-400/60'} style={{ width: `${Math.max(8, value / max * 100)}%` }}/></div></div>
      </button>
    })}</div> : <EmptyState title="尚無官方排行" description="TWSE 每日 JSON 尚未包含完整排行資料。"/>}
    <div className="border-t border-[var(--border-subtle)] px-4 py-3 text-[10px] leading-5 text-slate-600">排行已在每日資料同步階段由 TWSE STOCK_DAY_ALL 產生，元件不直接讀取或重新排序原始 JSON。</div>
  </Card>
}
