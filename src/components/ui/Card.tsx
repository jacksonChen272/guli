import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  title?: string
  eyebrow?: string
  action?: ReactNode
  footer?: ReactNode
  variant?: 'compact' | 'standard' | 'spacious'
  state?: 'default' | 'loading' | 'empty' | 'error'
  interactive?: boolean
}

export function Card({ title, eyebrow, action, footer, variant = 'standard', state = 'default', interactive = false, className = '', children, ...props }: CardProps) {
  return (
    <section className={`panel ui-card ui-card--${variant} ${interactive ? 'card-interactive' : ''} ${className}`} data-state={state} {...props}>
      {(title || eyebrow || action) && (
        <header className="ui-card__header flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            {title && <h2 className="type-card-title font-semibold tracking-tight text-white">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
      {footer && <footer className="border-t border-[var(--border-subtle)] px-5 py-4 text-sm text-slate-400 sm:px-6">{footer}</footer>}
    </section>
  )
}
