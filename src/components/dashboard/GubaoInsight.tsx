import { ArrowRight, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GubaoDrawer } from '../ai/GubaoDrawer'
import { GubaoMark } from '../brand/Gubao'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { generateMarketHeadline, generateMarketHighlights } from '../../services/marketInsightService'

export function GubaoInsight() {
  const [open, setOpen] = useState(false)
  const observations = useMemo(() => { const headline = generateMarketHeadline(); const highlights = generateMarketHighlights(); return [headline.headline, highlights[0].description, highlights.find((item) => item.direction === 'warning')?.description ?? '目前未出現重大警示。'] }, [])
  return <><Card className="h-full overflow-hidden"><div className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-5"><GubaoMark/><div><p className="eyebrow">GULI Rule Assistant</p><h2 className="mt-1 text-sm font-semibold text-white">股寶觀察</h2></div></div><div className="p-5"><div className="space-y-4">{observations.map((item, index) => <div key={item} className="flex gap-3"><span className="mono mt-0.5 text-[9px] text-brand-400">0{index + 1}</span><p className="text-[11px] leading-5 text-slate-400">{item}</p></div>)}</div><Button className="mt-5 w-full" onClick={() => setOpen(true)} icon={<MessageCircle size={14}/>}>詢問股寶 <ArrowRight size={13}/></Button></div></Card><GubaoDrawer open={open} onClose={() => setOpen(false)}/></>
}
