import { Activity, ArrowRight, Clock3, RefreshCw, Star } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CapitalRotationChart } from '../components/charts/CapitalRotationChart'
import { DataSourceInfoCard } from '../components/dashboard/DataSourceInfoCard'
import { DecisionDashboardCard } from '../components/dashboard/DecisionDashboardCard'
import { GubaoInsight } from '../components/dashboard/GubaoInsight'
import { MarketBreadth } from '../components/dashboard/MarketBreadth'
import { MarketHeadline } from '../components/dashboard/MarketHeadline'
import { MarketPulseGrid } from '../components/dashboard/MarketPulseGrid'
import { MarketRanking } from '../components/dashboard/MarketRanking'
import { MarketStatCard } from '../components/dashboard/MarketStatCard'
import { MarketSummary } from '../components/dashboard/MarketSummary'
import { MarketTemperature } from '../components/dashboard/MarketTemperature'
import { StockSnapshotPreview } from '../components/dashboard/StockSnapshotPreview'
import { TodayHighlights } from '../components/dashboard/TodayHighlights'
import { WatchlistDashboardPreview } from '../components/dashboard/WatchlistDashboardPreview'
import { IndustryRotationPreview } from '../components/industry/IndustryRotationPreview'
import { RotationDetailDrawer } from '../components/rotation/RotationDetailDrawer'
import { LatestSnapshotCard } from '../components/snapshot/LatestSnapshotCard'
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
  const { indices, tradingAmount, institutionalFlows, officialMarket, fieldSources } = overview
  const [mode, setMode] = useState<RotationMode>('industry')
  const [institution, setInstitution] = useState<InstitutionType>('all')
  const [period, setPeriod] = useState<Period>(20)
  const [selected, setSelected] = useState<RotationPoint | null>(null)
  const [updatedAt, setUpdatedAt] = useState('13:35')
  const navigate = useNavigate()
  const onSelect = useCallback((point: RotationPoint) => setSelected(point), [])
  const statCards = [
    { ...indices[0], source: fieldSources?.taiex ?? 'mock', updatedAt: officialMarket?.tradeDate ?? '模擬資料' },
    { ...indices[1], source: 'mock' as const, updatedAt: '模擬資料' },
    { name: '今日成交金額', code: 'TURNOVER', unit: '億', decimals: 0, ...tradingAmount, source: fieldSources?.tradingAmount ?? 'mock', updatedAt: officialMarket?.tradeDate ?? '模擬資料' },
    { name: '外資買賣超', code: 'FOREIGN', unit: '億', decimals: 1, ...institutionalFlows.foreign, source: 'mock' as const, updatedAt: '模擬資料' },
    { name: '投信買賣超', code: 'TRUST', unit: '億', decimals: 1, ...institutionalFlows.trust, source: 'mock' as const, updatedAt: '模擬資料' },
    { name: '自營商買賣超', code: 'DEALER', unit: '億', decimals: 1, ...institutionalFlows.dealer, source: 'mock' as const, updatedAt: '模擬資料' },
  ]
  return <div className="space-y-6">
    <SectionHeader eyebrow="GULI MARKET OVERVIEW" title="台股市場總覽" description="看見資金，看懂趨勢。用可解釋的規則整理今日市場脈絡。" action={<div className="flex flex-wrap items-center gap-2"><span className="flex h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-sm text-slate-400"><span className="h-2 w-2 rounded-full bg-slate-400" />盤後資料</span><span className="hidden h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-sm text-slate-400 sm:flex"><Clock3 size={15} />最後更新 {updatedAt}</span><Button variant="ghost" onClick={() => setUpdatedAt(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }))} icon={<RefreshCw size={16} />}>更新</Button><Button variant="ghost" onClick={() => navigate('/watchlist')} icon={<Star size={16} />}>自選股</Button></div>} />

    <section className="flex flex-col gap-6" aria-label="市場結論與資料狀態">
      <div className="order-2 lg:order-1"><DataSourceInfoCard onReload={() => setDataRevision((value) => value + 1)} /></div>
      <div className="order-1 lg:order-2"><MarketHeadline /></div>
    </section>

    <DecisionDashboardCard />
    <WatchlistDashboardPreview />

    <section className="space-y-5" aria-label="市場快照">
      <LatestSnapshotCard />
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 2xl:grid-cols-6">{statCards.map((card) => <div className="min-w-[240px] snap-start sm:min-w-0" key={card.code}><MarketStatCard {...card} /></div>)}</div>
      <MarketBreadth data={officialMarket} />
    </section>

    <section aria-label="產業輪動快照"><IndustryRotationPreview /></section>
    <section aria-label="個股快照"><StockSnapshotPreview /></section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12"><div className="xl:col-span-4"><MarketTemperature /></div><div className="xl:col-span-8"><MarketSummary /></div></section>
    <TodayHighlights />

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12"><Card className="overflow-hidden xl:col-span-8" title="資金輪動" eyebrow="CAPITAL ROTATION" action={<Button variant="ghost" onClick={() => navigate('/capital-flow')} icon={<ArrowRight size={16} />}>完整分析</Button>}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-5 sm:p-6"><div className="flex flex-wrap gap-2"><Tabs value={mode} onChange={setMode} options={[{ value: 'industry', label: '產業' }, { value: 'stock', label: '個股' }]} /><Select value={institution} onChange={(event) => setInstitution(event.target.value as InstitutionType)} aria-label="法人類型"><option value="all">三大法人</option><option value="foreign">外資</option><option value="trust">投信</option><option value="dealer">自營商</option></Select><Select value={period} onChange={(event) => setPeriod(Number(event.target.value) as Period)} aria-label="資料期間"><option value={5}>5 日</option><option value={10}>10 日</option><option value={20}>20 日</option></Select></div><span className="flex items-center gap-2 text-xs text-slate-500"><Activity size={14} />滾輪縮放 · 拖曳平移 · 點擊查看</span></div><CapitalRotationChart mode={mode} institution={institution} period={period} compact onSelect={onSelect} /><div className="grid gap-3 border-t border-[var(--border-subtle)] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"><p className="text-sm leading-6 text-slate-400"><span className="mr-2 font-medium text-slate-200">資料解讀</span>右上代表資金流入且動能加速；泡泡大小反映近 20 日累計資金絕對值。</p><Disclaimer>資料僅反映目前市場狀態，不代表未來漲跌。</Disclaimer></div></Card><div className="xl:col-span-4"><MarketRanking /></div></section>
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12"><div className="xl:col-span-8"><MarketPulseGrid /></div><div className="xl:col-span-4"><GubaoInsight /></div></section>
    <RotationDetailDrawer point={selected} onClose={() => setSelected(null)} />
  </div>
}
