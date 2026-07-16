import type { ReactNode } from 'react'
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'up' | 'down' | 'warning' | 'info' }) {
  const tones = { neutral: 'border-white/[0.08] bg-white/[0.035] text-slate-400', brand: 'border-brand-400/20 bg-brand-400/10 text-brand-300', up: 'border-red-400/20 bg-red-400/10 text-red-300', down: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300', warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300', info: 'border-blue-400/20 bg-blue-400/10 text-blue-300' }
  return <span className={`type-badge inline-flex min-h-7 items-center rounded-lg border px-2.5 py-1 font-medium ${tones[tone]}`}>{children}</span>
}
