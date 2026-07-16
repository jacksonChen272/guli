import { Bell, Menu, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { allPages } from '../../config/navigation'
import { GlobalStockSearch } from '../search/GlobalStockSearch'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation()
  const [softTheme, setSoftTheme] = useState(false)
  const current = pathname.startsWith('/stock/') ? { eyebrow: 'Stock Analysis', title: '個股分析' } : allPages.find((item) => item.path === pathname) ?? allPages[0]
  useEffect(() => { document.documentElement.classList.toggle('theme-soft', softTheme); return () => document.documentElement.classList.remove('theme-soft') }, [softTheme])
  return <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-page)_92%,transparent)] px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:px-6 lg:h-[72px] lg:px-8">
    <div className="flex min-w-0 items-center gap-3">
      <button type="button" onClick={onMenuClick} className="icon-button grid place-items-center rounded-xl border border-[var(--border-subtle)] text-slate-300 lg:hidden" aria-label="開啟側邊選單"><Menu size={20} /></button>
      <div className="min-w-0"><p className="mono hidden truncate text-xs uppercase tracking-[.12em] text-slate-500 sm:block">{current.eyebrow}</p><h1 className="truncate text-base font-semibold text-slate-100">{current.title}</h1></div>
    </div>
    <div className="flex items-center gap-2">
      <div className="mr-1 hidden items-center gap-2 border-r border-[var(--border-subtle)] pr-4 xl:flex"><span className="h-2 w-2 rounded-full bg-slate-400" /><div><p className="text-[13px] font-medium text-slate-200">台股已收盤</p><p className="mono text-[13px] text-slate-500">更新 13:35</p></div></div>
      <GlobalStockSearch />
      <button type="button" onClick={() => setSoftTheme((value) => !value)} className="icon-button hidden place-items-center rounded-xl border border-[var(--border-subtle)] text-slate-400 transition hover:border-[var(--border-strong)] hover:text-white sm:grid" aria-label={softTheme ? '切換深色主題' : '切換柔和主題'}>{softTheme ? <Moon size={18} /> : <Sun size={18} />}</button>
      <button type="button" className="icon-button relative grid place-items-center rounded-xl border border-[var(--border-subtle)] text-slate-400 transition hover:border-[var(--border-strong)] hover:text-white" aria-label="通知"><Bell size={18} /><span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-brand-400" /></button>
      <button type="button" className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] px-1.5 sm:px-2.5" aria-label="使用者選單"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-400/10 text-xs font-semibold text-brand-300">OW</span><span className="hidden text-sm text-slate-300 2xl:block">Owen</span></button>
    </div>
  </header>
}
