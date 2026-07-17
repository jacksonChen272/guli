import { ArrowRight, ScanSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { ScreenerDataset, ScreenerPresetId } from '../../types/screener'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'

const groups: Array<{ id: ScreenerPresetId; label: string }> = [{ id: 'strong-trend', label: '強勢趨勢' }, { id: 'breakout-volume', label: '突破量增' }, { id: 'institution-technical', label: '法人技術同步' }]

export function TechnicalScreenerPreview() {
  const navigate = useNavigate()
  const [dataset, setDataset] = useState<ScreenerDataset | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => { let active = true; void repositoryHub.screener.getDataset().then((value) => { if (active) setDataset(value) }).catch(() => { if (active) setError(true) }); return () => { active = false } }, [])
  return <Card title="今日技術選股" eyebrow="SMART SCREENER · COMPACT" action={<Button variant="ghost" onClick={() => navigate('/screener')} icon={<ArrowRight size={16}/>}>完整選股</Button>}>
    {!dataset && !error && <LoadingState rows={3}/>} {error && <p className="p-5 text-sm text-amber-300">技術選股索引尚未產生，請先執行 technical:index:generate 與 screener:generate。</p>}
    {dataset && <><div className="grid gap-4 p-5 lg:grid-cols-3">{groups.map((group) => <section key={group.id} className="rounded-xl border border-white/[.06] p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><ScanSearch size={16} className="text-brand-300"/>{group.label}</h3><ol className="mt-3 space-y-2">{dataset.results.filter((row) => row.presetId === group.id && row.matched).sort((a, b) => a.rank - b.rank).slice(0, 3).map((row) => <li key={row.symbol}><button type="button" onClick={() => navigate(`/stock/${row.symbol}`)} className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left hover:bg-white/[.04]"><span className="text-sm text-slate-300">{row.symbol} {row.name}</span><span className="mono text-sm text-brand-300">{row.technicalScore?.toFixed(0) ?? '—'}</span></button></li>)}</ol></section>)}</div><footer className="flex flex-wrap items-center gap-3 border-t border-white/[.06] px-5 py-4 text-xs text-slate-500"><Badge tone="info">樣本 {dataset.sampleCount} 檔</Badge><span>資料日 {dataset.tradeDate ?? '尚未取得'}</span><span>250 日覆蓋 {dataset.sampleCount ? Math.round(dataset.complete250Count / dataset.sampleCount * 100) : 0}%</span><span>高風險 {dataset.highRiskCount} 檔</span><span>非投資建議</span></footer></>}
  </Card>
}
