import { Info, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { allPages, dashboardPage, historyPage, industriesPage, routePages } from '../../config/navigation'
import { Logo } from '../brand/Logo'

type SidebarProps = { open:boolean; collapsed:boolean; onClose:()=>void; onToggleCollapse:()=>void }

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }:SidebarProps) {
  const navigate = useNavigate()
  const marketPages = [dashboardPage, historyPage, industriesPage, ...routePages.filter((page)=>!['/history','/industries','/ai','/data-status/stocks','/settings'].includes(page.path))]
  const systemPages = routePages.filter((page)=>['/ai','/data-status/stocks','/settings'].includes(page.path))
  return <>
    <button type="button" aria-label="關閉側邊欄" onClick={onClose} className={`fixed inset-0 z-40 bg-black/65 backdrop-blur-sm transition-opacity lg:hidden ${open?'pointer-events-auto opacity-100':'pointer-events-none opacity-0'}`}/>
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] transition-[width,transform] duration-200 ${collapsed?'w-20':'w-[248px]'} ${open?'translate-x-0':'-translate-x-full'} lg:translate-x-0`}>
      <div className={`flex h-[76px] items-center border-b border-[var(--border-subtle)] ${collapsed?'justify-center px-3':'justify-between px-5'}`}>
        <Logo compact={collapsed}/><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-white lg:hidden" aria-label="關閉側邊欄"><X size={19}/></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="主要導覽">
        <NavGroup label="市場工具" pages={marketPages} collapsed={collapsed} onClick={onClose}/>
        <NavGroup label="系統與資料" pages={systemPages} collapsed={collapsed} onClick={onClose}/>
      </nav>
      <div className="border-t border-[var(--border-subtle)] p-3">
        {!collapsed&&<div className="mb-2 rounded-xl border border-brand-400/15 bg-brand-400/[.035] p-3"><div className="flex items-center gap-2 text-[11px] text-slate-300"><span className="live-dot h-1.5 w-1.5 rounded-full bg-brand-400"/>Decision Engine 已啟用</div><p className="mono mt-1.5 text-[9px] text-brand-300">GULI v0.6.0 · DECISION ENGINE</p></div>}
        <button type="button" onClick={()=>navigate('/settings')} title="資料免責聲明" className={`mb-1 flex min-h-11 w-full items-center rounded-xl text-[11px] text-slate-600 hover:bg-white/[.035] hover:text-slate-300 ${collapsed?'justify-center px-0':'gap-3 px-3'}`}><Info size={16}/>{!collapsed&&'資料免責聲明'}</button>
        <button type="button" onClick={()=>navigate('/settings')} title="設定" className={`mb-1 flex min-h-11 w-full items-center rounded-xl text-[11px] text-slate-600 hover:bg-white/[.035] hover:text-slate-300 ${collapsed?'justify-center px-0':'gap-3 px-3'}`}><Settings size={16}/>{!collapsed&&'設定'}</button>
        <button type="button" onClick={onToggleCollapse} className="hidden min-h-11 w-full items-center justify-center rounded-xl text-slate-600 hover:bg-white/[.035] hover:text-brand-300 lg:flex" aria-label={collapsed?'展開側邊欄':'收合側邊欄'}>{collapsed?<PanelLeftOpen size={17}/>:<><PanelLeftClose size={17}/><span className="ml-2 text-[11px]">收合側邊欄</span></>}</button>
      </div>
    </aside>
  </>
}

function NavGroup({ label, pages, collapsed, onClick }:{ label:string; pages:typeof allPages; collapsed:boolean; onClick:()=>void }) {
  return <div className="mb-7">{!collapsed&&<p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-700">{label}</p>}<div className="space-y-1">{pages.map((page)=>{const Icon=page.icon;return <NavLink key={page.path} to={page.path} end={page.path==='/' } onClick={onClick} title={collapsed?page.label:undefined} className={({isActive})=>`relative flex min-h-11 items-center rounded-xl text-sm transition-colors ${collapsed?'justify-center px-0':'gap-3 px-3'} ${isActive?'bg-brand-400/[.09] text-brand-300':'text-slate-500 hover:bg-white/[.035] hover:text-slate-200'}`}>{({isActive})=><>{isActive&&<span className="absolute left-0 h-5 w-0.5 rounded-r bg-brand-400"/>}<Icon size={18} strokeWidth={isActive?2.1:1.7}/>{!collapsed&&<span>{page.label}</span>}</>}</NavLink>})}</div></div>
}
