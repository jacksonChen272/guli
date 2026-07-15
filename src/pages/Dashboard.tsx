import { Activity, ArrowRight, Clock3, RefreshCw, Star } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CapitalRotationChart } from '../components/charts/CapitalRotationChart'
import { GubaoInsight } from '../components/dashboard/GubaoInsight'
import { MarketHeadline } from '../components/dashboard/MarketHeadline'
import { MarketPulseGrid } from '../components/dashboard/MarketPulseGrid'
import { MarketRanking } from '../components/dashboard/MarketRanking'
import { MarketStatCard } from '../components/dashboard/MarketStatCard'
import { MarketSummary } from '../components/dashboard/MarketSummary'
import { MarketTemperature } from '../components/dashboard/MarketTemperature'
import { TodayHighlights } from '../components/dashboard/TodayHighlights'
import { DataSourceInfoCard } from '../components/dashboard/DataSourceInfoCard'
import { MarketBreadth } from '../components/dashboard/MarketBreadth'
import { StockSnapshotPreview } from '../components/dashboard/StockSnapshotPreview'
import { DecisionDashboardCard } from '../components/dashboard/DecisionDashboardCard'
import { LatestSnapshotCard } from '../components/snapshot/LatestSnapshotCard'
import { IndustryRotationPreview } from '../components/industry/IndustryRotationPreview'
import { RotationDetailDrawer } from '../components/rotation/RotationDetailDrawer'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Select } from '../components/ui/Select'
import { Tabs } from '../components/ui/Tabs'
import { marketRepository } from '../services/dataRepository'
import type { InstitutionType, Period, RotationMode, RotationPoint } from '../types/market'

export function Dashboard() {
  const [, setDataRevision] = useState(0)
  const overview = marketRepository.getOverview()
  const { indices: mockMarketIndices, tradingAmount: mockTradingAmount, institutionalFlows: mockInstitutionalFlows, officialMarket, fieldSources } = overview
  const [mode, setMode] = useState<RotationMode>('industry')
  const [institution, setInstitution] = useState<InstitutionType>('all')
  const [period, setPeriod] = useState<Period>(20)
  const [selected, setSelected] = useState<RotationPoint | null>(null)
  const [updatedAt, setUpdatedAt] = useState('13:35')
  const navigate = useNavigate()
  const onSelect = useCallback((point: RotationPoint) => setSelected(point), [])
  const statCards = [
    { ...mockMarketIndices[0], source: fieldSources?.taiex ?? 'mock', updatedAt: officialMarket?.tradeDate ?? '模擬資料' },
    { ...mockMarketIndices[1], source: 'mock' as const, updatedAt: '模擬資料' },
    { name: '今日成交金額', code: 'TURNOVER', unit: '億', decimals: 0, ...mockTradingAmount, source: fieldSources?.tradingAmount ?? 'mock', updatedAt: officialMarket?.tradeDate ?? '模擬資料' },
    { name: '外資買賣超', code: 'FOREIGN', unit: '億', decimals: 1, ...mockInstitutionalFlows.foreign, source: 'mock' as const, updatedAt: '模擬資料' },
    { name: '投信買賣超', code: 'TRUST', unit: '億', decimals: 1, ...mockInstitutionalFlows.trust, source: 'mock' as const, updatedAt: '模擬資料' },
    { name: '自營商買賣超', code: 'DEALER', unit: '億', decimals: 1, ...mockInstitutionalFlows.dealer, source: 'mock' as const, updatedAt: '模擬資料' },
  ]
  return <div className="space-y-5">
    <SectionHeader eyebrow="GULI MARKET OVERVIEW" title="台股市場總覽" description="看見資金，看懂趨勢。用可解釋的規則整理今日市場脈絡。" action={<div className="flex flex-wrap items-center gap-2"><span className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-[10px] text-slate-500"><span className="h-2 w-2 rounded-full bg-slate-500"/>盤後資料</span><span className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-[10px] text-slate-600 sm:flex"><Clock3 size={12}/>最後更新 {updatedAt}</span><Button size="sm" variant="ghost" onClick={() => setUpdatedAt(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }))} icon={<RefreshCw size={13}/>}>更新</Button><Button size="sm" variant="ghost" onClick={() => navigate('/watchlist')} icon={<Star size={13}/>}>自選股</Button></div>}/>
    <MarketHeadline/>
    <DecisionDashboardCard/>
    <div className="rounded-xl border border-blue-400/15 bg-blue-400/[.04] px-4 py-3 text-[11px] text-blue-200/80">目前部分欄位已接入 TWSE 官方盤後資料，其餘欄位仍為模擬資料。</div>
    <DataSourceInfoCard onReload={() => setDataRevision((value) => value + 1)}/>
    <section aria-label="今日市場快照"><LatestSnapshotCard/></section>
    <section aria-label="產業輪動快照"><IndustryRotationPreview/></section>
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-12"><div className="xl:col-span-4"><MarketTemperature/></div><div className="xl:col-span-8"><MarketSummary/></div></section>
    <section aria-label="市場統計" className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 2xl:grid-cols-6">{statCards.map((card) => <div className="min-w-[230px] snap-start sm:min-w-0" key={card.code}><MarketStatCard {...card}/></div>)}</section>
    <StockSnapshotPreview/>
    <MarketBreadth data={officialMarket}/>
    <TodayHighlights/>
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-12"><Card className="overflow-hidden xl:col-span-8" title="資金輪動" eyebrow="Capital Rotation" action={<Button size="sm" variant="ghost" onClick={() => navigate('/capital-flow')} icon={<ArrowRight size={13}/>}>完整分析</Button>}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-4"><div className="flex flex-wrap gap-2"><Tabs value={mode} onChange={setMode} options={[{ value: 'industry', label: '產業' }, { value: 'stock', label: '個股' }]}/><Select value={institution} onChange={(event) => setInstitution(event.target.value as InstitutionType)} aria-label="法人類型"><option value="all">三大法人</option><option value="foreign">外資</option><option value="trust">投信</option><option value="dealer">自營商</option></Select><Select value={period} onChange={(event) => setPeriod(Number(event.target.value) as Period)} aria-label="資料期間"><option value={5}>5 日</option><option value={10}>10 日</option><option value={20}>20 日</option></Select></div><span className="flex items-center gap-1.5 text-[9px] text-slate-600"><Activity size={12}/>滾輪縮放 · 拖曳平移 · 點擊查看</span></div><CapitalRotationChart mode={mode} institution={institution} period={period} compact onSelect={onSelect}/><div className="grid gap-3 border-t border-[var(--border-subtle)] p-4 sm:grid-cols-[1fr_auto] sm:items-center"><p className="text-[10px] leading-5 text-slate-600"><span className="mr-2 font-medium text-slate-400">資料解讀</span>右上代表資金流入且動能加速；泡泡大小反映近 20 日累計資金絕對值。</p><Disclaimer>資料僅反映 mock 市場狀態，不代表未來漲跌。</Disclaimer></div></Card><div className="xl:col-span-4"><MarketRanking/></div></section>
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-12"><div className="xl:col-span-8"><MarketPulseGrid/></div><div className="xl:col-span-4"><GubaoInsight/></div></section>
    <RotationDetailDrawer point={selected} onClose={() => setSelected(null)}/>
  </div>
}
