import { Filter, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { HighlightCard } from '../components/dashboard/TodayHighlights'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Select } from '../components/ui/Select'
import { generateMarketHighlights } from '../services/marketInsightService'

export function MarketFocus() {
  const highlights = useMemo(() => generateMarketHighlights(), [])
  const [type, setType] = useState('all')
  const [direction, setDirection] = useState('all')
  const [risk, setRisk] = useState('all')
  const [search, setSearch] = useState('')
  const filtered = highlights.filter((item) => (type === 'all' || item.type === type) && (direction === 'all' || item.direction === direction) && (risk === 'all' || item.riskLevel === risk) && (!search || `${item.title}${item.description}${item.related.join('')}`.includes(search)))
  return <div className="space-y-8"><SectionHeader eyebrow="MARKET FOCUS" title="市場焦點" description="由產業強弱、法人、量價、突破與風險規則整理今日重要訊號。" /><Card title="焦點篩選器" eyebrow="FILTERS" variant="compact"><div className="flex flex-wrap gap-3 p-5 sm:p-6"><label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[#0d1317] px-3"><Search size={17} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋股票、產業或焦點" className="w-full bg-transparent text-[15px] text-white outline-none" /></label><Select value={type} onChange={(event) => setType(event.target.value)} aria-label="焦點類型"><option value="all">全部類型</option>{[...new Set(highlights.map((item) => item.type))].map((value) => <option key={value}>{value}</option>)}</Select><Select value={direction} onChange={(event) => setDirection(event.target.value)} aria-label="焦點方向"><option value="all">全部方向</option><option value="positive">正向</option><option value="neutral">中性</option><option value="warning">警示</option></Select><Select value={risk} onChange={(event) => setRisk(event.target.value)} aria-label="風險等級"><option value="all">全部風險</option><option value="低">低風險</option><option value="中">中風險</option><option value="高">高風險</option></Select></div></Card><p className="flex items-center gap-2 text-sm text-slate-400"><Filter size={16} />共 {filtered.length} 筆焦點</p><section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="市場焦點卡片">{filtered.map((item) => <HighlightCard key={item.id} item={item} />)}</section>{!filtered.length && <div className="panel p-12 text-center text-sm text-slate-500">目前沒有符合篩選條件的市場焦點。</div>}</div>
}
