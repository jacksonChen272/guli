import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockIndustries } from '../../data/mockIndustries'
import { mockStocks } from '../../data/mockStocks'
import { Card } from '../ui/Card'
import { Tabs } from '../ui/Tabs'

type RankingTab = 'strong' | 'weak' | 'institution' | 'volume'

export function MarketRanking() {
  const [tab, setTab] = useState<RankingTab>('strong')
  const navigate = useNavigate()
  const items = useMemo(() => {
    if (tab === 'strong') return [...mockIndustries].sort((a, b) => b.changePercent - a.changePercent).slice(0, 6).map((item) => ({ id: item.id, name: item.name, value: item.changePercent, display: `${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`, route: '/capital-flow', up: item.changePercent >= 0 }))
    if (tab === 'weak') return [...mockIndustries].sort((a, b) => a.changePercent - b.changePercent).slice(0, 6).map((item) => ({ id: item.id, name: item.name, value: Math.abs(item.changePercent), display: `${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`, route: '/capital-flow', up: item.changePercent >= 0 }))
    if (tab === 'institution') return [...mockStocks].sort((a, b) => b.institutions.total - a.institutions.total).slice(0, 6).map((item) => ({ id: item.symbol, name: `${item.symbol} ${item.name}`, value: Math.abs(item.institutions.total), display: `${item.institutions.total.toFixed(1)} 百萬`, route: `/stock/${item.symbol}`, up: item.institutions.total >= 0 }))
    return [...mockStocks].sort((a, b) => b.volume - a.volume).slice(0, 6).map((item) => ({ id: item.symbol, name: `${item.symbol} ${item.name}`, value: item.volume, display: `${(item.volume / 1000).toFixed(1)}K 張`, route: `/stock/${item.symbol}`, up: item.changePercent >= 0 }))
  }, [tab])
  const max = Math.max(...items.map((item) => item.value), 1)
  return <Card title="市場排行榜" eyebrow="Market Ranking"><div className="overflow-x-auto border-b border-white/[0.055] p-3"><Tabs value={tab} onChange={setTab} options={[{ value: 'strong', label: '強勢產業' }, { value: 'weak', label: '弱勢產業' }, { value: 'institution', label: '法人買超' }, { value: 'volume', label: '成交量異常' }]} /></div><div className="p-3 sm:p-4">{items.map((item, index) => <button type="button" key={item.id} onClick={() => navigate(item.route)} className="group grid w-full grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 py-2.5 text-left transition hover:bg-white/[0.03]"><span className={`mono text-[10px] ${index < 3 ? 'text-brand-300' : 'text-slate-700'}`}>{String(index + 1).padStart(2, '0')}</span><div className="min-w-0"><p className="truncate text-[11px] text-slate-300 group-hover:text-white">{item.name}</p><div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/[0.04]"><div className={`h-full ${item.up ? 'bg-red-400/70' : 'bg-emerald-400/70'}`} style={{ width: `${Math.max(8, item.value / max * 100)}%` }} /></div></div><span className={`mono text-[10px] ${item.up ? 'text-red-400' : 'text-emerald-400'}`}>{item.display}</span></button>)}</div></Card>
}
