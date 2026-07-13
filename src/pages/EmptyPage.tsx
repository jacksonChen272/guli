import { ArrowRight, Construction } from 'lucide-react'
import { Card } from '../components/ui/Card'
import type { PageConfig } from '../config/navigation'

export function EmptyPage({ page }: { page: PageConfig }) {
  const Icon = page.icon
  return (
    <div className="space-y-6">
      <div><p className="eyebrow mb-2">{page.eyebrow}</p><h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{page.title}</h2><p className="mt-2 text-sm text-slate-500">{page.description}</p></div>
      <Card className="relative min-h-[480px] overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/[0.035] blur-3xl" />
        <div className="relative flex min-h-[480px] flex-col items-center justify-center px-6 text-center">
          <div className="relative mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-brand-400/15 bg-brand-400/[0.06] text-brand-300 shadow-glow"><Icon size={26} strokeWidth={1.5} /><span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-ink-850 bg-amber-400 text-ink-950"><Construction size={10} /></span></div>
          <p className="mono mb-2 text-[10px] uppercase tracking-[0.24em] text-brand-400">Module initialized</p>
          <h3 className="text-lg font-semibold text-white">{page.title}模組已就緒</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">頁面基礎架構與導覽已完成，後續可在此串接即時行情、策略模型與個人化資料。</p>
          <button type="button" className="mt-7 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs text-slate-300 transition hover:border-brand-400/25 hover:text-brand-300">查看開發藍圖 <ArrowRight size={13} /></button>
        </div>
      </Card>
    </div>
  )
}
