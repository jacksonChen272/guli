import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-ink-950 text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen lg:pl-[268px]">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 lg:px-9 lg:py-8"><Outlet /></main>
      </div>
    </div>
  )
}
