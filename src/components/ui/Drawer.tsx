import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return <div className={`fixed inset-0 z-[70] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}><button type="button" aria-label="關閉詳細資料" onClick={onClose} className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} /><aside role="dialog" aria-modal="true" aria-label={title} className={`absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-white/[0.08] bg-[#0b1014] shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}><header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-white/[0.07] bg-[#0b1014]/95 px-5 backdrop-blur"><h2 className="text-sm font-semibold text-white">{title}</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="關閉"><X size={18} /></button></header>{children}</aside></div>
}
