import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; icon?: ReactNode }

export function Button({ variant = 'secondary', size = 'md', icon, className = '', children, ...props }: ButtonProps) {
  const variants = { primary: 'border-brand-400 bg-brand-400 text-[#062118] hover:bg-brand-300', secondary: 'border-white/[0.08] bg-white/[0.035] text-slate-300 hover:border-brand-400/25 hover:text-brand-300', ghost: 'border-transparent bg-transparent text-slate-500 hover:bg-white/[0.035] hover:text-white', danger: 'border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15' }
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition disabled:pointer-events-none disabled:opacity-40 ${size === 'sm' ? 'px-3.5 py-2' : 'px-4 py-2.5'} ${variants[variant]} ${className}`} {...props}>{icon}{children}</button>
}
