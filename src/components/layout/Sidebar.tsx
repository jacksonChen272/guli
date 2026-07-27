import { Database, GitBranch, Info, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { allPages, marketNavigationPaths, systemNavigationPaths, type PageConfig } from '../../config/navigation'
import { Logo } from '../brand/Logo'

// Historical release contract: GULI v1.0.0-beta.3.1 · Decision Engine v1.0 · Market Heatmap. Current UI version is rendered below.

type SidebarProps = { open: boolean; collapsed: boolean; onClose: () => void; onToggleCollapse: () => void }
const pagesByPath = new Map(allPages.map((page) => [page.path, page]))
const resolveNavigation = (paths: readonly string[]): PageConfig[] => paths.map((path) => pagesByPath.get(path)).filter((page): page is PageConfig => page !== undefined)
const marketPages = resolveNavigation(marketNavigationPaths)
const systemPages = resolveNavigation(systemNavigationPaths)

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate()
  const panelClass = 'fixed inset-y-0 left-0 z-50 flex max-w-[86vw] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] transition-[width,transform] duration-200 ' + (collapsed ? 'w-[272px] lg:w-20 ' : 'w-[272px] ') + (open ? 'translate-x-0' : '-translate-x-full') + ' lg:translate-x-0'
  return <>
    <button type="button" aria-label="關閉側邊欄" onClick={onClose} className={'fixed inset-0 z-40 bg-black/65 backdrop-blur-sm transition-opacity lg:hidden ' + (open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')}/>
    <aside className={panelClass}>
      <div className={'flex h-20 items-center border-b border-[var(--border-subtle)] ' + (collapsed ? 'justify-center px-3' : 'justify-between px-5')}><Logo compact={collapsed}/><button type="button" onClick={onClose} className="icon-button grid place-items-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="關閉側邊欄"><X size={20}/></button></div>
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="主要導覽"><NavGroup label="市場工具" pages={marketPages} collapsed={collapsed} onClick={onClose}/><NavGroup label="系統與資料" pages={systemPages} collapsed={collapsed} onClick={onClose}/></nav>
      <div className="border-t border-[var(--border-subtle)] p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {!collapsed && <div className="mb-2 rounded-xl border border-brand-400/20 bg-brand-400/[.045] p-3.5"><p className="mono text-[13px] font-semibold text-brand-300">GULI v1.2.0</p><div className="mt-3 space-y-2 text-[13px] text-slate-300"><Status icon={<LayoutDashboard size={14}/>} text="Dashboard 3.0"/><Status icon={<Database size={14}/>} text="TWSE Official Data"/><Status icon={<GitBranch size={14}/>} text="Decision v1.0"/></div><p className="mono mt-3 border-t border-white/[.06] pt-2 text-[11px] text-slate-500">official · derived · mock 分層</p></div>}
        <SidebarButton collapsed={collapsed} icon={<Info size={18}/>} label="資料免責聲明" onClick={() => navigate('/settings')}/>
        <SidebarButton collapsed={collapsed} icon={<Settings size={18}/>} label="設定" onClick={() => navigate('/settings')}/>
        <button data-testid="desktop-sidebar-collapse" type="button" onClick={onToggleCollapse} className="hidden min-h-11 w-full items-center justify-center rounded-xl text-slate-400 hover:bg-white/[.045] hover:text-brand-300 lg:flex" aria-label={collapsed ? '展開側邊欄' : '收合側邊欄'}>{collapsed ? <PanelLeftOpen size={18}/> : <><PanelLeftClose size={18}/><span className="ml-2 text-sm">收合側邊欄</span></>}</button>
      </div>
    </aside>
  </>
}

function SidebarButton({ collapsed, icon, label, onClick }: { collapsed: boolean; icon: ReactNode; label: string; onClick: () => void }) { return <button type="button" onClick={onClick} title={label} className={'mb-1 flex min-h-11 w-full items-center rounded-xl text-sm text-slate-400 hover:bg-white/[.045] hover:text-slate-100 ' + (collapsed ? 'justify-center px-0' : 'gap-3 px-3')}>{icon}{!collapsed && label}</button> }
function Status({ icon, text }: { icon: ReactNode; text: string }) { return <div className="flex items-center gap-2">{icon}<span>{text}</span></div> }
function NavGroup({ label, pages, collapsed, onClick }: { label: string; pages: typeof allPages; collapsed: boolean; onClick: () => void }) { return <div className="mb-7">{!collapsed && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[.1em] text-slate-500">{label}</p>}<div className="space-y-1">{pages.map((page) => { const Icon = page.icon; return <NavLink key={page.path} to={page.path} end={page.path === '/'} onClick={onClick} title={collapsed ? page.label : undefined} className={({ isActive }) => 'relative flex min-h-12 items-center rounded-xl text-base font-medium transition-colors ' + (collapsed ? 'justify-center px-0 ' : 'gap-3 px-3 ') + (isActive ? 'border border-brand-400/20 bg-brand-400/[.11] text-brand-200 shadow-[inset_0_0_20px_rgba(47,197,154,.04)]' : 'border border-transparent text-slate-400 hover:bg-white/[.04] hover:text-slate-100')}>{({ isActive }) => <>{isActive && <span className="absolute left-0 h-6 w-1 rounded-r bg-brand-400"/>}<Icon size={20} strokeWidth={isActive ? 2.2 : 1.8}/>{!collapsed && <span>{page.label}</span>}</>}</NavLink> })}</div></div> }
