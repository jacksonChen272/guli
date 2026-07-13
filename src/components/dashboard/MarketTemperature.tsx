import { CloudRain, Info, Sun } from 'lucide-react'
import { mockMarketTemperature } from '../../data/mockMarket'
import { Card } from '../ui/Card'
import { Disclaimer } from '../ui/Disclaimer'
import { Tooltip } from '../ui/Tooltip'

const getStatus = (score: number) => score <= 20 ? '極弱' : score <= 40 ? '偏弱' : score <= 60 ? '中性' : score <= 80 ? '偏強' : '極強'

export function MarketTemperature() {
  const data = mockMarketTemperature
  const rotation = -90 + (data.score / 100) * 180
  const WeatherIcon = data.weather === '晴天' ? Sun : CloudRain
  return <Card className="overflow-hidden" title="市場溫度" eyebrow="Market Temperature" action={<Tooltip label="綜合法人、量能、漲跌家數與動能計算"><button type="button" className="text-slate-600 hover:text-slate-300" aria-label="市場溫度說明"><Info size={16} /></button></Tooltip>}>
    <div className="grid gap-7 p-5 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:p-6">
      <div><div className="relative mx-auto h-[130px] w-[260px] overflow-hidden"><div className="absolute left-1/2 top-4 h-[240px] w-[240px] -translate-x-1/2 rounded-full bg-[conic-gradient(from_270deg,#34d399_0deg,#f6b94a_90deg,#fb7185_180deg,rgba(255,255,255,.06)_180deg)] p-[14px]"><div className="h-full w-full rounded-full bg-ink-850" /></div><div className="absolute bottom-0 left-1/2 h-[91px] w-0.5 origin-bottom -translate-x-1/2 bg-white/80 shadow-[0_0_10px_white] transition-transform duration-700" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} /><div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center"><p className="mono text-4xl font-medium text-white">{data.score}</p><p className="mt-1 text-xs font-semibold text-brand-300">{getStatus(data.score)}</p></div></div><div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400"><WeatherIcon size={16} className="text-amber-300" /> 今日市場天氣：<span className="font-medium text-white">{data.weather}</span></div></div>
      <div className="space-y-3">{data.reasons.map((reason) => <div key={reason.label} className="rounded-xl border border-white/[0.055] bg-white/[0.018] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] text-slate-300">{reason.label}</span><span className="mono text-[10px] text-brand-300">{reason.value}</span></div><div className="h-1 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-brand-400" style={{ width: `${reason.value}%` }} /></div><p className="mt-2 text-[10px] text-slate-600">{reason.description}</p></div>)}</div>
    </div><div className="px-5 pb-5 lg:px-6 lg:pb-6"><Disclaimer>市場溫度僅反映當日數據狀態，不代表未來漲跌。</Disclaimer></div>
  </Card>
}
