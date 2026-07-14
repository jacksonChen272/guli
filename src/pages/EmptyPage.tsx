import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'
import type { PageConfig } from '../config/navigation'

const features:Record<string,string[]>={
  '/market-focus':['市場事件時間軸','題材熱度與關聯產業','個人化焦點通知'],
  '/stock-analysis':['多面向個股健檢','法人籌碼與技術趨勢','同產業比較'],
  '/swing-strategy':['策略條件建立','歷史績效回測','風險與部位管理'],
  '/watchlist':['自選股群組管理','異常量價提醒','法人動向追蹤'],
  '/ai-assistant':['自然語言市場問答','個人化盤勢整理','研究問題建議'],
  '/settings':['通知與顯示偏好','自選股資料管理','帳戶與隱私設定'],
}

export function EmptyPage({page}:{page:PageConfig}) {
  const Icon=page.icon; const navigate=useNavigate(); const items=features[page.path]??['市場資料整合','個人化分析','即時狀態追蹤']
  return <div className="space-y-5"><SectionHeader eyebrow={page.eyebrow} title={page.title} description={page.description}/><Card className="overflow-hidden"><div className="grid min-h-[500px] lg:grid-cols-[.9fr_1.1fr]"><div className="flex flex-col justify-center border-b border-[var(--border-subtle)] p-8 lg:border-b-0 lg:border-r lg:p-12"><div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-brand-400/20 bg-brand-400/[.06] text-brand-300"><Icon size={27} strokeWidth={1.5}/></div><p className="eyebrow">Coming Soon</p><h3 className="mt-3 text-2xl font-semibold text-white">{page.title}即將推出</h3><p className="mt-3 max-w-md text-sm leading-7 text-slate-500">我們正在整理最適合台股投資者的資訊結構，讓每一項資料都能清楚支持你的判斷。</p><Button className="mt-7 w-fit" onClick={()=>navigate('/')} icon={<ArrowLeft size={14}/>}>返回市場總覽</Button></div><div className="flex flex-col justify-center bg-white/[.012] p-8 lg:p-12"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-600">預計提供</p><div className="mt-6 space-y-4">{items.map((item,index)=><div key={item} className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"><span className="mono text-[10px] text-brand-400">0{index+1}</span><span className="flex-1 text-sm text-slate-300">{item}</span><CheckCircle2 size={16} className="text-slate-700"/></div>)}</div><div className="mt-8 flex items-end gap-2" aria-hidden="true">{[32,56,42,78,64,92,72].map((height,index)=><span key={index} className="w-full rounded-t bg-brand-400/10" style={{height}}/>)}</div></div></div></Card></div>
}
