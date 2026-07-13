import type { ReactNode } from 'react'
export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h2>{description && <p className="mt-2 text-sm text-slate-500">{description}</p>}</div>{action}</div>
}
