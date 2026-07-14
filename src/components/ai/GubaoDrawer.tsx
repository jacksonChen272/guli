import { MessageCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { answerGubaoQuestion, gubaoQuestions, type GubaoQuestion } from '../../services/gubaoService'
import { useWatchlistStore } from '../../stores/watchlistStore'
import { GubaoMark } from '../brand/Gubao'
import { Drawer } from '../ui/Drawer'

export function GubaoDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<GubaoQuestion | null>(null)
  const items = useWatchlistStore((state) => state.items)
  const answer = selected ? answerGubaoQuestion(selected, items) : null
  return <Drawer open={open} onClose={onClose} title="詢問股寶"><div className="p-5 sm:p-6"><div className="flex items-center gap-4 rounded-2xl border border-tech-blue/20 bg-blue-400/[.04] p-4"><GubaoMark className="h-12 w-12"/><div><h3 className="text-sm font-semibold text-white">股寶規則型市場觀察</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">所有回答皆由目前 mock data 與明確規則即時計算，不使用生成式 AI。</p></div></div>
    <p className="mb-3 mt-6 text-[10px] font-semibold tracking-wider text-slate-500">選擇快速問題</p><div className="space-y-2">{gubaoQuestions.map((question) => <button type="button" key={question} onClick={() => setSelected(question)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-[11px] transition ${selected === question ? 'border-brand-400/30 bg-brand-400/[.06] text-white' : 'border-[var(--border-subtle)] text-slate-400 hover:border-[var(--border-strong)] hover:text-white'}`}><MessageCircle size={13}/>{question}</button>)}</div>
    <div className="mt-5 min-h-[150px] rounded-2xl border border-[var(--border-subtle)] bg-white/[.018] p-4">{answer ? <><p className="flex items-center gap-2 text-[10px] font-medium text-brand-300"><Sparkles size={13}/>股寶回答</p><p className="mt-3 text-sm leading-7 text-slate-300">{answer}</p></> : <div className="grid min-h-[115px] place-items-center text-center text-[11px] text-slate-600">選擇上方問題，股寶會依規則整理答案。</div>}</div><p className="mt-4 text-[9px] leading-5 text-slate-600">本內容僅供資訊參考，不構成投資建議。</p></div></Drawer>
}
