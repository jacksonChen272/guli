import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & { title?: string; eyebrow?: string; action?: ReactNode }

export function Card({ title, eyebrow, action, className = '', children, ...props }: CardProps) {
  return (
    <section className={`panel ${className}`} {...props}>
      {(title || eyebrow || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.055] px-5 py-4 sm:px-6">
          <div>
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            {title && <h2 className="text-[15px] font-semibold tracking-wide text-white">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
