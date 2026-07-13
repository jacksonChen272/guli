import { ArrowRight, Clock3 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CapitalRotationChart } from '../components/charts/CapitalRotationChart'
import { MarketRanking } from '../components/dashboard/MarketRanking'
import { MarketStatCard } from '../components/dashboard/MarketStatCard'
import { MarketSummary } from '../components/dashboard/MarketSummary'
import { MarketTemperature } from '../components/dashboard/MarketTemperature'
import { RotationDetailDrawer } from '../components/rotation/RotationDetailDrawer'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Select } from '../components/ui/Select'
import { Tabs } from '../components/ui/Tabs'
import { mockInstitutionalFlows, mockMarketIndices, mockTradingAmount } from '../data/mockMarket'
import type { InstitutionType, Period, RotationMode, RotationPoint } from '../types/market'

export function Dashboard() {
  const [mode, setMode] = useState<RotationMode>('industry')
  const [institution, setInstitution] = useState<InstitutionType>('all')
  const [period, setPeriod] = useState<Period>(20)
  const [selected, setSelected] = useState<RotationPoint | null>(null)
  const navigate = useNavigate()
  const onSelect = useCallback((point: RotationPoint) => setSelected(point), [])
  const statCards = [
    { ...mockMarketIndices[0] },
    { ...mockMarketIndices[1] },
    { name: '今日成交金額', code: 'TURNOVER', unit: '億', decimals: 0, ...mockTradingAmount },
    { name: '外資買賣超', code: 'FOREIGN', unit: '億', decimals: 1, ...mockInstitutionalFlows.foreign },
    { name: '投信買賣超', code: 'TRUST', unit: '億', decimals: 1, ...mockInstitutionalFlows.trust },
    { name: '自營商買賣超', code: 'DEALER', unit: '億', decimals: 1, ...mockInstitutionalFlows.dealer },
  ]
  return <div className="space-y-6"><SectionHeader eyebrow="Monday · 13 July 2026" title="午安，Owen" description="今日市場偏強，資金集中於電子權值、AI 伺服器與 PCB 供應鏈。" action={<div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-slate-500"><Clock3 size={13} /> 資料更新 13:35:08</div>} />
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 2xl:grid-cols-6">{statCards.map((card) => <div className="snap-start" key={card.code}><MarketStatCard {...card} /></div>)}</div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12"><div className="xl:col-span-7"><MarketTemperature /></div><div className="xl:col-span-5"><MarketSummary /></div></div>
    <Card title="資金輪動預覽" eyebrow="Capital Rotation" action={<Button size="sm" variant="ghost" onClick={() => navigate('/capital-flow')} icon={<ArrowRight size={13} />}>完整資金輪動</Button>}>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.055] p-4"><Tabs value={mode} onChange={setMode} options={[{ value: 'industry', label: '產業' }, { value: 'stock', label: '個股' }]} /><Select value={institution} onChange={(event) => setInstitution(event.target.value as InstitutionType)} aria-label="法人類型"><option value="all">三大法人</option><option value="foreign">外資</option><option value="trust">投信</option><option value="dealer">自營商</option></Select><Select value={period} onChange={(event) => setPeriod(Number(event.target.value) as Period)} aria-label="觀察期間"><option value={5}>5 日</option><option value={10}>10 日</option><option value={20}>20 日</option></Select></div>
      <CapitalRotationChart mode={mode} institution={institution} period={period} compact onSelect={onSelect} />
      <div className="px-5 pb-5"><Disclaimer>泡泡大小代表近 20 日累計資金絕對值；點擊泡泡可查看詳細資料。</Disclaimer></div>
    </Card>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12"><div className="xl:col-span-12"><MarketRanking /></div></div>
    <RotationDetailDrawer point={selected} onClose={() => setSelected(null)} />
  </div>
}
