import type { ReactNode } from 'react'
export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="max-w-4xl">{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="type-page-title font-semibold tracking-tight text-white">{title}</h1>{description && <p className="type-body mt-2 text-slate-400">{description}</p>}</div>{action}</div>
}
