import { Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { allPages } from '../../config/navigation'
import { GlobalStockSearch } from '../search/GlobalStockSearch'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation()
  const current = pathname.startsWith('/stock/')
    ? { eyebrow: 'Stock Analysis', title: '個股分析' }
    : allPages.find((item) => item.path === pathname) ?? allPages[0]
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-ink-950/80 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5 text-slate-300 hover:border-brand-400/30 hover:text-brand-300 lg:hidden" aria-label="開啟側邊選單"><Menu size={19} /></button>
        <div className="min-w-0"><p className="mono mb-0.5 truncate text-[9px] uppercase tracking-[0.18em] text-slate-600">{current.eyebrow}</p><h1 className="truncate text-sm font-semibold text-slate-100 sm:text-base">{current.title}</h1></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <GlobalStockSearch />
        <button type="button" className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500 transition hover:border-white/15 hover:text-white" aria-label="通知"><Bell size={17} /><span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full border border-ink-950 bg-brand-400" /></button>
        <button type="button" className="ml-1 grid h-9 w-9 place-items-center rounded-full border border-brand-400/20 bg-gradient-to-br from-brand-400/25 to-slate-800 text-xs font-semibold text-brand-300" aria-label="使用者選單">OW</button>
      </div>
    </header>
  )
}
