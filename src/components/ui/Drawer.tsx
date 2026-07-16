import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = originalOverflow; previous?.focus() }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[70] overflow-hidden"
    >
      <button
        type="button"
        aria-label="關閉抽屜"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-0 w-full max-w-none overflow-y-auto bg-[#0b1014] pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-y-0 sm:left-auto sm:max-w-xl sm:border-l sm:border-white/[0.08]"
      >
        <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#0b1014]/95 px-5 backdrop-blur sm:px-6">
          <h2 className="text-[22px] font-semibold tracking-tight text-white">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="icon-button grid place-items-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="關閉"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </aside>
    </div>
  , document.body)
}
