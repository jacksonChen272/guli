import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { GubaoDrawer } from '../components/ai/GubaoDrawer'
import { GubaoMark } from '../components/brand/Gubao'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'
import { gubaoQuestions } from '../services/gubaoService'

export function GubaoPage() { const [open, setOpen] = useState(false); return <div className="space-y-5"><SectionHeader eyebrow="GULI RULE ASSISTANT" title="股寶" description="以可追溯的市場規則回答常見問題，不使用生成式 AI。"/><Card><div className="grid gap-8 p-6 lg:grid-cols-[.7fr_1.3fr] lg:items-center"><div className="flex flex-col items-center rounded-3xl border border-tech-blue/15 bg-blue-400/[.025] p-8 text-center"><GubaoMark className="h-24 w-24"/><h2 className="mt-5 text-xl font-semibold text-white">問股寶，看懂今天</h2><p className="mt-2 text-sm leading-6 text-slate-500">市場、產業、個股與自選股風險，都由既有資料與固定規則推導。</p><Button className="mt-6" onClick={() => setOpen(true)} icon={<MessageCircle size={15}/>}>開始提問</Button></div><div><p className="eyebrow">可回答的問題</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{gubaoQuestions.map((question) => <button type="button" key={question} onClick={() => setOpen(true)} className="min-h-14 rounded-xl border border-[var(--border-subtle)] p-4 text-left text-xs text-slate-300 transition hover:border-brand-400/25 hover:bg-white/[.02]">{question}</button>)}</div></div></div></Card><GubaoDrawer open={open} onClose={() => setOpen(false)}/></div> }
