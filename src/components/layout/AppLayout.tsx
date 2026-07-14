import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return <div className="min-h-screen bg-[var(--bg-page)] text-slate-100"><Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} /><div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-[248px]'}`}><TopBar onMenuClick={() => setSidebarOpen(true)} /><main className="relative mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6"><div className="page-enter"><Outlet /></div></main></div></div>
}
