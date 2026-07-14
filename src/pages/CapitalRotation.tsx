import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CapitalRotationChart } from '../components/charts/CapitalRotationChart'
import { RotationDetailDrawer } from '../components/rotation/RotationDetailDrawer'
import { RotationPlayback } from '../components/rotation/RotationPlayback'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Select } from '../components/ui/Select'
import { Tabs } from '../components/ui/Tabs'
import { marketRepository } from '../services/dataRepository'
import type { InstitutionType, MarketBoard, Period, RotationMode, RotationPoint } from '../types/market'

export function CapitalRotation() {
  const mockIndustries = marketRepository.getIndustries()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<RotationMode>('stock')
  const [institution, setInstitution] = useState<InstitutionType>('all')
  const [period, setPeriod] = useState<Period>(20)
  const [board, setBoard] = useState<MarketBoard>('all')
  const [industry, setIndustry] = useState(params.get('industry') ?? 'all')
  const [search, setSearch] = useState('')
  const [showTrails, setShowTrails] = useState(true)
  const [dateIndex, setDateIndex] = useState(19)
  const [selected, setSelected] = useState<RotationPoint | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const onSelect = useCallback((point: RotationPoint) => setSelected(point), [])
  const reset = () => { setMode('stock'); setInstitution('all'); setPeriod(20); setBoard('all'); setIndustry('all'); setSearch(''); setShowTrails(true); setDateIndex(19) }

  return <div className="space-y-6"><SectionHeader eyebrow="Capital Flow · GULI v0.2" title="資金輪動" description="觀察法人資金流向與動能變化，定位市場資金正加速前往的區域。" action={<Button className="md:hidden" onClick={() => setFiltersOpen((value) => !value)} icon={<Filter size={14} />}>{filtersOpen ? '收合篩選' : '展開篩選'}</Button>} />
    <Card className={`${filtersOpen ? 'block' : 'hidden'} md:block`}><div className="flex flex-wrap items-end gap-3 p-4 sm:p-5"><div><p className="mb-2 text-[9px] text-slate-600">顯示模式</p><Tabs value={mode} onChange={setMode} options={[{ value: 'industry', label: '產業模式' }, { value: 'stock', label: '個股模式' }]} /></div><FilterSelect label="法人類型"><Select value={institution} onChange={(event) => setInstitution(event.target.value as InstitutionType)}><option value="all">三大法人</option><option value="foreign">外資</option><option value="trust">投信</option><option value="dealer">自營商</option></Select></FilterSelect><FilterSelect label="觀察期間"><Select value={period} onChange={(event) => setPeriod(Number(event.target.value) as Period)}><option value={1}>1 日</option><option value={5}>5 日</option><option value={10}>10 日</option><option value={20}>20 日</option></Select></FilterSelect><FilterSelect label="市場"><Select value={board} onChange={(event) => setBoard(event.target.value as MarketBoard)} disabled={mode === 'industry'}><option value="all">全部</option><option value="listed">上市</option><option value="otc">上櫃</option></Select></FilterSelect><FilterSelect label="產業"><Select className="min-w-36" value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="all">全部產業</option>{mockIndustries.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</Select></FilterSelect><div className="min-w-[190px] flex-1"><p className="mb-2 text-[9px] text-slate-600">股票搜尋</p><label className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d1317] px-3 focus-within:border-brand-400/30"><Search size={13} className="text-slate-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} disabled={mode === 'industry'} placeholder="代號或名稱" className="w-full bg-transparent text-[11px] text-slate-300 outline-none disabled:opacity-40" /></label></div><label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-[11px] text-slate-500"><input type="checkbox" checked={showTrails} onChange={(event) => setShowTrails(event.target.checked)} className="accent-brand-400" /> 顯示軌跡</label><Button onClick={reset} variant="ghost" icon={<RotateCcw size={13} />}>重設</Button></div></Card>
    <Card title="四象限資金輪動圖" eyebrow="Rotation Matrix" action={<span className="flex items-center gap-2 text-[10px] text-slate-600"><SlidersHorizontal size={12} /> 滾輪縮放 · 拖曳平移 · 點擊查看</span>}><div className="min-h-[520px]"><CapitalRotationChart mode={mode} institution={institution} period={period} board={board} industry={industry} search={search} showTrails={showTrails} dateIndex={dateIndex} onSelect={onSelect} /></div><div className="px-5 pb-5"><Disclaimer>圖表資料為模擬資料，僅供產品功能展示與市場結構觀察，不構成投資建議。</Disclaimer></div></Card>
    <RotationPlayback dateIndex={dateIndex} onDateChange={setDateIndex} showTrails={showTrails} onTrailsChange={setShowTrails} />
    <RotationDetailDrawer point={selected} onClose={() => setSelected(null)} />
  </div>
}

function FilterSelect({ label, children }: { label: string; children: React.ReactNode }) { return <div><p className="mb-2 text-[9px] text-slate-600">{label}</p>{children}</div> }
