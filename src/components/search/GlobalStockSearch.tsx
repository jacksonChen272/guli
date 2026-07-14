import { ArrowUpRight, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { marketRepository } from '../../services/dataRepository'

const mockStocks = marketRepository.getStocks()

export function GlobalStockSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const results = useMemo(() => {
    const value = debouncedQuery.trim().toLowerCase()
    if (!value) return mockStocks.slice(0, 6)
    return mockStocks.filter((stock) => stock.symbol.includes(value) || stock.name.toLowerCase().includes(value)).slice(0, 8)
  }, [debouncedQuery])

  const close = () => { setOpen(false); setMobileOpen(false); setQuery(''); setActiveIndex(0) }
  const select = (symbol: string) => { close(); navigate(`/stock/${symbol}`) }

  useEffect(() => {
    const clickOutside = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query), 180); return () => window.clearTimeout(timer) }, [query])
  useEffect(() => { if (mobileOpen) window.setTimeout(() => inputRef.current?.focus(), 50) }, [mobileOpen])

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { close(); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, results.length - 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)) }
    if (event.key === 'Enter' && results[activeIndex]) select(results[activeIndex].symbol)
  }

  const content = (
    <>
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-slate-500 focus-within:border-brand-400/30"><Search size={16} /><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" placeholder="搜尋股票代號或名稱" aria-label="搜尋股票" aria-expanded={open} role="combobox" /><span className="mono hidden text-[9px] text-slate-700 lg:block">⌘K</span></div>
      {open && <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0d1317] shadow-2xl"><div className="border-b border-white/[0.06] px-4 py-2.5 text-[10px] text-slate-600">{query ? `找到 ${results.length} 筆結果` : '熱門搜尋'}</div><div className="max-h-[420px] overflow-y-auto p-1.5">{results.length ? results.map((stock, index) => <button type="button" key={stock.symbol} onMouseEnter={() => setActiveIndex(index)} onClick={() => select(stock.symbol)} className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 py-3 text-left transition ${index === activeIndex ? 'bg-brand-400/[0.08]' : 'hover:bg-white/[0.035]'}`}><div className="min-w-0"><div className="flex items-center gap-2"><span className="mono text-xs text-brand-300">{stock.symbol}</span><span className="truncate text-xs font-medium text-white">{stock.name}</span></div><p className="mt-1 text-[10px] text-slate-600">{stock.industry}</p></div><div className="text-right"><p className="mono text-xs text-slate-300">{stock.price.toLocaleString()}</p><p className={`mono mt-1 text-[10px] ${stock.changePercent >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>{stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</p></div></button>) : <p className="px-4 py-10 text-center text-xs text-slate-600">找不到符合的股票</p>}</div></div>}
    </>
  )

  return <div ref={rootRef} className="relative"><div className="hidden w-64 md:block">{content}</div><button type="button" onClick={() => { setMobileOpen(true); setOpen(true) }} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500 md:hidden" aria-label="開啟股票搜尋"><Search size={17} /></button>{mobileOpen && <div className="fixed inset-0 z-[90] bg-ink-950 p-4 md:hidden"><div className="mb-4 flex items-center gap-3"><div className="relative flex-1">{content}</div><button type="button" onClick={close} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] text-slate-400" aria-label="關閉搜尋"><X size={18} /></button></div><div className="mt-[470px] flex items-center justify-center gap-2 text-[10px] text-slate-700"><ArrowUpRight size={11} /> 選擇股票進入個股分析</div></div>}</div>
}
