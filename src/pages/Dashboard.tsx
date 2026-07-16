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
import { toHundredMillionShares, toHundredMillionTWD } from '../services/twseMarketNormalization'
import type { InstitutionType, Period, RotationMode, RotationPoint } from '../types/market'

export function Dashboard() {
  const [, setDataRevision] = useState(0)
  const overview = marketRepository.getOverview()
  const { officialMarket } = overview
  const [mode, setMode] = useState<RotationMode>('industry')
  const [institution, setInstitution] = useState<InstitutionType>('all')
  const [period, setPeriod] = useState<Period>(20)
  const [selected, setSelected] = useState<RotationPoint | null>(null)
  const [updatedAt, setUpdatedAt] = useState('13:35')
  const navigate = useNavigate()
  const onSelect = useCallback((point: RotationPoint) => setSelected(point), [])
  const officialHistory = officialMarket?.tradingHistory ?? []
  const currentHistoryIndex = officialHistory.findIndex((point) => point.tradeDate === officialMarket?.tradeDate)
  const previousTrading = currentHistoryIndex > 0 ? officialHistory[currentHistoryIndex - 1] : undefined
  const source = officialMarket?.status === 'official' ? 'official' as const : officialMarket?.status === 'partial' ? 'partial' as const : 'fallback' as const
  const updatedDate = officialMarket?.tradeDate ?? '無官方資料'
  const amountValue = toHundredMillionTWD(officialMarket?.tradingAmount ?? 0)
  const previousAmount = toHundredMillionTWD(previousTrading?.tradingAmount ?? officialMarket?.tradingAmount ?? 0)
  const volumeValue = toHundredMillionShares(officialMarket?.tradingVolume ?? 0)
  const previousVolume = toHundredMillionShares(previousTrading?.tradingVolume ?? officialMarket?.tradingVolume ?? 0)
  const statCards = officialMarket ? [
    {
      name: '加權指數', code: 'TAIEX', value: officialMarket.indexValue, change: officialMarket.change,
      changePercent: officialMarket.changePercent, previousValue: officialMarket.indexValue - officialMarket.change,
      trend: officialHistory.map((point) => ({ date: point.tradeDate, value: point.indexValue })), source, updatedAt: updatedDate,
    },
    {
      name: '上市成交值', code: 'TRADE VALUE', unit: '億', decimals: 0, value: amountValue,
      change: amountValue - previousAmount, changePercent: previousAmount ? (amountValue - previousAmount) / previousAmount * 100 : 0,
      previousValue: previousAmount, trend: officialHistory.map((point) => ({ date: point.tradeDate, value: toHundredMillionTWD(point.tradingAmount) })), source, updatedAt: updatedDate,
    },
    {
      name: '上市成交量', code: 'TRADE VOLUME', unit: '億股', decimals: 2, value: volumeValue,
      change: volumeValue - previousVolume, changePercent: previousVolume ? (volumeValue - previousVolume) / previousVolume * 100 : 0,
      previousValue: previousVolume, trend: officialHistory.map((point) => ({ date: point.tradeDate, value: toHundredMillionShares(point.tradingVolume) })), source, updatedAt: updatedDate,
    },
  ] : []
  return <div className="space-y-6">
    <SectionHeader eyebrow="GULI MARKET OVERVIEW" title="台股市場總覽" description="看見資金，看懂趨勢。用可解釋的規則整理今日市場脈絡。" action={<div className="flex flex-wrap items-center gap-2"><span className="flex h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-sm text-slate-400"><span className="h-2 w-2 rounded-full bg-slate-400" />盤後資料</span><span className="hidden h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-sm text-slate-400 sm:flex"><Clock3 size={15} />最後更新 {updatedAt}</span><Button variant="ghost" onClick={() => setUpdatedAt(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }))} icon={<RefreshCw size={16} />}>更新</Button><Button variant="ghost" onClick={() => navigate('/watchlist')} icon={<Star size={16} />}>自選股</Button></div>} />

    <section className="flex flex-col gap-6" aria-label="市場結論與資料狀態">
      <div className="order-2 lg:order-1"><DataSourceInfoCard onReload={() => setDataRevision((value) => value + 1)} /></div>
      <div className="order-1 lg:order-2"><MarketHeadline /></div>
    </section>

    <DecisionDashboardCard />
    <WatchlistDashboardPreview />

    <section className="space-y-5" aria-label="TWSE 官方市場統計">
      <LatestSnapshotCard />
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium text-slate-200">TWSE 官方市場統計</p><p className="mt-1 text-[10px] text-slate-600">指數、成交值、成交量與市場廣度均來自每日更新的 TWSE JSON。</p></div><span className="rounded-full border border-brand-400/20 bg-brand-400/[.06] px-3 py-1.5 text-[10px] font-medium text-brand-300">TWSE Official · {updatedDate}</span></div>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">{statCards.map((card) => <div className="min-w-[240px] snap-start sm:min-w-0" key={card.code}><MarketStatCard {...card} /></div>)}</div>
      <MarketBreadth data={officialMarket} />
    </section>

    <section aria-label="產業輪動快照"><IndustryRotationPreview /></section>
    <section aria-label="個股快照"><StockSnapshotPreview /></section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12"><div className="xl:col-span-4"><MarketTemperature /></div><div className="xl:col-span-8"><MarketSummary /></div></section>
    <TodayHighlights />

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12"><Card className="overflow-hidden xl:col-span-8" title="資金輪動" eyebrow="CAPITAL ROTATION" action={<Button variant="ghost" onClick={() => navigate('/capital-flow')} icon={<ArrowRight size={16} />}>完整分析</Button>}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-5 sm:p-6"><div className="flex flex-wrap gap-2"><Tabs value={mode} onChange={setMode} options={[{ value: 'industry', label: '產業' }, { value: 'stock', label: '個股' }]} /><Select value={institution} onChange={(event) => setInstitution(event.target.value as InstitutionType)} aria-label="法人類型"><option value="all">三大法人</option><option value="foreign">外資</option><option value="trust">投信</option><option value="dealer">自營商</option></Select><Select value={period} onChange={(event) => setPeriod(Number(event.target.value) as Period)} aria-label="資料期間"><option value={5}>5 日</option><option value={10}>10 日</option><option value={20}>20 日</option></Select></div><span className="flex items-center gap-2 text-xs text-slate-500"><Activity size={14} />滾輪縮放 · 拖曳平移 · 點擊查看</span></div><CapitalRotationChart mode={mode} institution={institution} period={period} compact onSelect={onSelect} /><div className="grid gap-3 border-t border-[var(--border-subtle)] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"><p className="text-sm leading-6 text-slate-400"><span className="mr-2 font-medium text-slate-200">資料解讀</span>右上代表資金流入且動能加速；泡泡大小反映近 20 日累計資金絕對值。</p><Disclaimer>資料僅反映目前市場狀態，不代表未來漲跌。</Disclaimer></div></Card><div className="xl:col-span-4"><MarketRanking data={officialMarket} /></div></section>
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12"><div className="xl:col-span-8"><MarketPulseGrid /></div><div className="xl:col-span-4"><GubaoInsight /></div></section>
    <RotationDetailDrawer point={selected} onClose={() => setSelected(null)} />
  </div>
}
