import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IndustryMemoryCard } from '../components/industry/IndustryMemoryCard'
import { MarketMemoryCard } from '../components/snapshot/MarketMemoryCard'
import { SnapshotDetail } from '../components/snapshot/SnapshotDetail'
import { SnapshotTimeline } from '../components/snapshot/SnapshotTimeline'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Tabs } from '../components/ui/Tabs'
import { industrySnapshotService } from '../services/industrySnapshot/IndustrySnapshotService'
import { MarketMemoryService } from '../services/snapshot/MarketMemoryService'
import { marketSnapshotService } from '../services/snapshot/MarketSnapshotService'
import { SnapshotDiffService } from '../services/snapshot/SnapshotDiffService'
import type { IndustryMemory } from '../types/industrySnapshot'
import type { MarketSnapshot, SnapshotIndexItem } from '../types/snapshot'
export function MarketHistory() {
  const [params, setParams] = useSearchParams(); const [history, setHistory] = useState<MarketSnapshot[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [days, setDays] = useState<5|10|20>(5); const [industryMemory, setIndustryMemory] = useState<IndustryMemory | null>(null)
  useEffect(() => { let active = true; void marketSnapshotService.getHistory(20).then((values) => { if (!active) return; setHistory(values); if (!params.get('date') && values[0]) setParams({date:values[0].tradeDate},{replace:true}); setLoading(false) }).catch(() => { if (active) { setError('市場歷史資料目前無法讀取。'); setLoading(false) } }); return () => { active = false } }, [params,setParams])
  useEffect(() => { let active = true; void industrySnapshotService.getIndustryMemory(days).then((value) => { if (active) setIndustryMemory(value) }).catch(() => { if (active) setIndustryMemory(null) }); return () => { active = false } }, [days])
  const selectedDate = params.get('date') ?? ''; const selected = history.find((item) => item.tradeDate === selectedDate)
  const diff = useMemo(() => selected ? new SnapshotDiffService().compare(selected, history.filter((item) => item.tradeDate < selected.tradeDate).sort((a,b) => b.tradeDate.localeCompare(a.tradeDate))[0]) : null, [history,selected])
  const memory = useMemo(() => new MarketMemoryService().calculate(history,days), [history,days])
  const timeline: SnapshotIndexItem[] = history.map((item) => ({tradeDate:item.tradeDate,path:`data/history/${item.tradeDate}.json`,marketStatus:item.marketStatus,marketTemperature:item.marketTemperature,headline:item.headline}))
  return <div className="space-y-5"><SectionHeader eyebrow="MARKET HISTORY" title="市場歷史" description="以實際存在的 Market Snapshot 與 Industry Snapshot 回顧市場變化；不補造缺少日期。"/>{loading ? <div className="panel p-5"><LoadingState rows={6}/></div> : error ? <div className="panel"><EmptyState title="無法讀取市場歷史" description={error}/></div> : !history.length ? <div className="panel"><EmptyState title="尚無市場快照" description="請先執行快照產生流程。"/></div> : <><div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]"><aside className="panel p-3"><p className="mb-3 px-2 text-[10px] font-medium text-slate-500">可用交易日期</p><SnapshotTimeline items={timeline} selected={selectedDate} onSelect={(date) => setParams({date})}/></aside><main>{selected && diff ? <SnapshotDetail snapshot={selected} diff={diff}/> : <div className="panel"><EmptyState title="請選擇快照" description="從左側選擇交易日期。"/></div>}</main></div><div className="flex justify-end"><Tabs value={days} onChange={setDays} options={[{value:5,label:'近 5 日'},{value:10,label:'近 10 日'},{value:20,label:'近 20 日'}]}/></div><MarketMemoryCard memory={memory}/>{industryMemory && <IndustryMemoryCard memory={industryMemory}/>}</>}</div>
}
