import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { allPages } from '../../config/navigation'
import { Logo } from '../brand/Logo'

type SidebarProps = { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <button type="button" aria-label="關閉側邊選單" onClick={onClose} className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-white/[0.07] bg-[#090d10]/95 px-4 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.06] px-2">
          <Logo />
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="關閉選單"><X size={19} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-5" aria-label="主要導覽">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">Workspace</p>
          <div className="space-y-1">{allPages.slice(0, 6).map((page) => <NavItem key={page.path} page={page} onClick={onClose} />)}</div>
          <p className="px-3 pb-3 pt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">Intelligence</p>
          <div className="space-y-1">{allPages.slice(6).map((page) => <NavItem key={page.path} page={page} onClick={onClose} />)}</div>
        </nav>
        <div className="mb-4 rounded-xl border border-brand-400/10 bg-brand-400/[0.045] p-3.5">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300"><span className="live-dot h-1.5 w-1.5 rounded-full bg-brand-400" /> 系統即時連線</div>
          <p className="mono text-[10px] text-slate-600">TW MARKET · 13:30 CLOSED</p>
        </div>
      </aside>
    </>
  )
}

function NavItem({ page, onClick }: { page: (typeof allPages)[number]; onClick: () => void }) {
  const Icon = page.icon
  return (
    <NavLink to={page.path} end={page.path === '/'} onClick={onClick} className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${isActive ? 'bg-brand-400/[0.09] font-medium text-brand-300' : 'text-slate-500 hover:bg-white/[0.035] hover:text-slate-200'}`}>
      {({ isActive }) => <>
        {isActive && <span className="absolute -left-4 h-5 w-0.5 rounded-r bg-brand-400 shadow-[0_0_12px_#32e2b0]" />}
        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.7} /><span>{page.label}</span>
        {page.path === '/ai-assistant' && <span className="mono ml-auto rounded border border-brand-400/20 bg-brand-400/10 px-1.5 py-0.5 text-[8px] text-brand-400">AI</span>}
      </>}
    </NavLink>
  )
}
