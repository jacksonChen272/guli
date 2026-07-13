import type { ReactNode } from 'react'
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'up' | 'down' | 'warning' }) {
  const tones = { neutral: 'border-white/[0.08] bg-white/[0.035] text-slate-400', brand: 'border-brand-400/20 bg-brand-400/10 text-brand-300', up: 'border-red-400/20 bg-red-400/10 text-red-300', down: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300', warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300' }
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-medium ${tones[tone]}`}>{children}</span>
}
