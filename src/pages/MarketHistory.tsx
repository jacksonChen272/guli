import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MarketMemoryCard } from '../components/snapshot/MarketMemoryCard'
import { SnapshotDetail } from '../components/snapshot/SnapshotDetail'
import { SnapshotTimeline } from '../components/snapshot/SnapshotTimeline'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Tabs } from '../components/ui/Tabs'
import { marketSnapshotService } from '../services/snapshot/MarketSnapshotService'
import { SnapshotDiffService } from '../services/snapshot/SnapshotDiffService'
import { MarketMemoryService } from '../services/snapshot/MarketMemoryService'
import type { MarketMemory, MarketSnapshot, MarketSnapshotDiff, SnapshotIndexItem } from '../types/snapshot'

export function MarketHistory() {
  const [params, setParams] = useSearchParams(); const [history, setHistory] = useState<MarketSnapshot[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [days, setDays] = useState<5 | 10 | 20>(5)
  useEffect(() => { let active = true; void marketSnapshotService.getHistory(20).then((values) => { if (!active) return; setHistory(values); const requested = params.get('date'); if (!requested && values[0]) setParams({ date: values[0].tradeDate }, { replace: true }); setLoading(false) }).catch(() => { if (active) { setError('市場歷史資料暫時無法讀取。'); setLoading(false) } }); return () => { active = false } }, [params, setParams])
  const selectedDate = params.get('date') ?? ''; const selected = history.find((item) => item.tradeDate === selectedDate)
  const diff: MarketSnapshotDiff | null = useMemo(() => selected ? new SnapshotDiffService().compare(selected, history.filter((item) => item.tradeDate < selected.tradeDate).sort((a, b) => b.tradeDate.localeCompare(a.tradeDate))[0]) : null, [history, selected])
  const memory: MarketMemory = useMemo(() => new MarketMemoryService().calculate(history, days), [history, days])
  const timeline: SnapshotIndexItem[] = history.map((item) => ({ tradeDate: item.tradeDate, path: `data/history/${item.tradeDate}.json`, marketStatus: item.marketStatus, marketTemperature: item.marketTemperature, headline: item.headline }))
  return <div className="space-y-5"><SectionHeader eyebrow="MARKET HISTORY" title="市場回顧" description="以實際保存的 Market Snapshot 回查市場狀態；官方與模擬欄位會分別標示。"/>{loading ? <div className="panel p-5"><LoadingState rows={6}/></div> : error ? <div className="panel"><EmptyState title="無法讀取市場歷史" description={error}/></div> : !history.length ? <div className="panel"><EmptyState title="尚無市場快照" description="完成盤後同步後即可建立第一份 Snapshot。"/></div> : <><div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]"><aside className="panel p-3"><p className="mb-3 px-2 text-[10px] font-medium text-slate-500">可用交易日期</p><SnapshotTimeline items={timeline} selected={selectedDate} onSelect={(date) => setParams({ date })}/></aside><main>{selected && diff ? <SnapshotDetail snapshot={selected} diff={diff}/> : <div className="panel"><EmptyState title="找不到指定日期" description="請從左側選擇目前實際存在的交易日 Snapshot。"/></div>}</main></div><div className="flex justify-end"><Tabs value={days} onChange={setDays} options={[{ value: 5, label: '近 5 日' }, { value: 10, label: '近 10 日' }, { value: 20, label: '近 20 日' }]}/></div><MarketMemoryCard memory={memory}/></>}</div>
}
