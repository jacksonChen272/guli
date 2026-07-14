import { ArrowLeft, BarChart3, Building2, Gauge, ShieldCheck, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FactorScoreList } from '../components/stock/FactorScoreList'
import { HealthRadarChart } from '../components/stock/HealthRadarChart'
import { HealthScoreGauge } from '../components/stock/HealthScoreGauge'
import { InstitutionalChart } from '../components/stock/InstitutionalChart'
import { PeerComparison } from '../components/stock/PeerComparison'
import { RiskAlerts } from '../components/stock/RiskAlerts'
import { StockPriceChart } from '../components/stock/StockPriceChart'
import { VolumeChart } from '../components/stock/VolumeChart'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Tabs } from '../components/ui/Tabs'
import { WatchlistButton } from '../components/watchlist/WatchlistButton'
import { marketRepository } from '../services/dataRepository'
import { calculateRiskLevel, calculateStockHealth } from '../services/stockHealthService'

type ChartRange = 5 | 20 | 60

export function StockDetail() {
  const { symbol = '' } = useParams()
  const mockStocks = marketRepository.getStocks()
  const stock = marketRepository.getStock(symbol)
  const navigate = useNavigate()
  const [days, setDays] = useState<ChartRange>(20)
  const health = useMemo(() => stock ? calculateStockHealth(stock, mockStocks) : null, [stock])
  if (!stock || !health) return <Card><EmptyState title="找不到這檔股票" description="請重新搜尋正確的股票代號或名稱。" /></Card>
  const up = stock.changePercent >= 0
  const riskLevel = calculateRiskLevel(health.risks)
  const signals = [
    { label: stock.price > stock.priceHistory.slice(-20).reduce((sum, point) => sum + point.value, 0) / 20 ? '站上月線' : '跌破月線', positive: stock.price > stock.priceHistory.slice(-20).reduce((sum, point) => sum + point.value, 0) / 20 },
    { label: stock.institutions.total >= 0 ? '法人買超' : '法人賣超', positive: stock.institutions.total >= 0 },
    { label: stock.rsi > 70 ? '短線偏熱' : stock.rsi < 35 ? '動能偏弱' : '動能中性', positive: stock.rsi >= 45 && stock.rsi <= 70 },
  ]
  return <div className="space-y-5">
    <SectionHeader eyebrow="Stock Health Check" title={`${stock.name} ${stock.symbol}`} description="依量價、法人、籌碼與風險規則計算的個股健檢，不使用隨機分數。" action={<div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={14}/>}>返回</Button><WatchlistButton symbol={stock.symbol}/></div>}/>

    <section className="grid gap-5 xl:grid-cols-12">
      <Card className="xl:col-span-8"><div className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><div className="flex flex-wrap gap-2"><Badge tone="brand">{stock.industry}</Badge><Badge>{stock.board === 'listed' ? '上市' : '上櫃'}</Badge></div><p className="mono mt-5 text-4xl font-semibold text-white">{stock.price.toLocaleString()}</p><p className={`mono mt-2 text-sm ${up ? 'text-red-300' : 'text-emerald-300'}`}>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}／{stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</p></div><div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[330px]"><Metric label="成交量" value={`${stock.volume.toLocaleString()} 張`}/><Metric label="RSI" value={stock.rsi.toFixed(0)}/><Metric label="20 日波動率" value={`${stock.volatility.toFixed(2)}%`}/><Metric label="風險等級" value={riskLevel}/></div></div><div className="mt-6 rounded-2xl border border-brand-400/15 bg-brand-400/[.035] p-4"><p className="flex items-center gap-2 text-xs font-medium text-white"><ShieldCheck size={15} className="text-brand-300"/>健檢摘要</p><p className="mt-2 text-sm leading-7 text-slate-300">{health.summary}</p><p className="mt-2 text-[10px] text-slate-600">本內容僅供資訊參考，不構成投資建議。</p></div></div></Card>
      <Card className="xl:col-span-4" title="健康總分" eyebrow="Weighted Score"><div className="p-5"><HealthScoreGauge health={health}/><div className="mt-5 flex justify-center gap-2"><Badge tone={health.totalScore >= 66 ? 'up' : health.totalScore >= 51 ? 'warning' : 'down'}>{health.grade}</Badge><Badge>產業：{stock.industry}</Badge></div></div></Card>
    </section>

    <section className="grid gap-5 xl:grid-cols-12"><Card className="xl:col-span-5" title="六項分數" eyebrow="Factor Scores"><div className="p-5"><FactorScoreList factors={health.factors}/></div></Card><Card className="xl:col-span-7" title="分數雷達與產業比較" eyebrow="Industry Benchmark"><HealthRadarChart factors={health.factors}/></Card></section>

    <Card title="價格趨勢、支撐與壓力" eyebrow="Price Structure" action={<Tabs value={days} onChange={setDays} options={[{ value: 5, label: '5 日' }, { value: 20, label: '20 日' }, { value: 60, label: '60 日' }]}/>}><StockPriceChart stock={stock} days={days} levels={health.supportResistance}/><div className="grid gap-3 border-t border-[var(--border-subtle)] p-5 sm:grid-cols-2 xl:grid-cols-4">{health.supportResistance.map((level) => <div key={`${level.type}-${level.order}`} className="rounded-xl border border-[var(--border-subtle)] p-3"><div className="flex items-center justify-between"><span className="text-[10px] text-slate-500">第{level.order}{level.type}</span><Badge tone={level.type === '支撐' ? 'down' : 'up'}>{level.strength}</Badge></div><p className="mono mt-2 text-lg text-white">{level.price.toLocaleString()}</p><p className="mt-1 text-[9px] text-slate-600">距現價 {level.distancePercent > 0 ? '+' : ''}{level.distancePercent.toFixed(2)}% · {level.isNear ? '已接近' : '尚有距離'}</p></div>)}</div></Card>

    <section className="grid gap-5 xl:grid-cols-2"><Card title="法人趨勢" eyebrow="Institutional Flow" action={<Building2 size={15} className="text-slate-600"/>}><InstitutionalChart stock={stock} days={days}/></Card><Card title="成交量與均量" eyebrow="Volume Profile" action={<BarChart3 size={15} className="text-slate-600"/>}><VolumeChart stock={stock} days={days}/></Card></section>

    <section className="grid gap-5 xl:grid-cols-12"><Card className="xl:col-span-7" title="風險提醒" eyebrow="Risk Alerts"><div className="p-5"><RiskAlerts risks={health.risks}/></div></Card><Card className="xl:col-span-5" title="近期訊號" eyebrow="Recent Signals"><div className="space-y-3 p-5">{signals.map((signal) => <div key={signal.label} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] p-4"><span className="flex items-center gap-2 text-xs text-slate-300"><TrendingUp size={14} className={signal.positive ? 'text-red-300' : 'text-emerald-300'}/>{signal.label}</span><Badge tone={signal.positive ? 'up' : 'down'}>{signal.positive ? '正向' : '留意'}</Badge></div>)}<div className="grid grid-cols-3 gap-2 pt-2"><Metric label="外資" value={`${stock.institutions.foreign.toFixed(1)} 張`}/><Metric label="投信" value={`${stock.institutions.trust.toFixed(1)} 張`}/><Metric label="自營商" value={`${stock.institutions.dealer.toFixed(1)} 張`}/></div></div></Card></section>

    <Card title="同產業比較" eyebrow="Peer Comparison" action={<Gauge size={15} className="text-slate-600"/>}><PeerComparison stock={stock} universe={mockStocks}/></Card>
    <Disclaimer>健康分數與支撐壓力均由目前 mock 資料及固定規則計算；本內容僅供資訊參考，不構成投資建議。</Disclaimer>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[.018] p-3"><p className="text-[9px] text-slate-600">{label}</p><p className="mono mt-2 text-xs text-slate-200">{value}</p></div> }
