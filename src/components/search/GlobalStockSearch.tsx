import { ArrowLeft, Clock3, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatSignedChange, formatStockPrice } from '../../lib/formatters'
import { marketRepository } from '../../services/dataRepository'

const stocks = marketRepository.getStocks()
const recentKey = 'guli-recent-stock-searches'

export function GlobalStockSearch({ variant = 'topbar' }: { variant?: 'topbar' | 'hero' } = {}) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [recent, setRecent] = useState<string[]>(() => readRecent())
  const rootRef = useRef<HTMLDivElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const hero = variant === 'hero'
  const results = useMemo(() => {
    const value = debouncedQuery.trim().toLowerCase()
    if (!value) {
      const recentStocks = recent.map((symbol) => stocks.find((stock) => stock.symbol === symbol)).filter((stock): stock is (typeof stocks)[number] => Boolean(stock))
      return recentStocks.length ? recentStocks : stocks.slice(0, 6)
    }
    return stocks.filter((stock) => stock.symbol.includes(value) || stock.name.toLowerCase().includes(value)).slice(0, 8)
  }, [debouncedQuery, recent])

  const close = () => { setOpen(false); setMobileOpen(false); setQuery(''); setActiveIndex(0) }
  const select = (symbol: string) => {
    const next = [symbol, ...recent.filter((item) => item !== symbol)].slice(0, 5)
    setRecent(next)
    try { localStorage.setItem(recentKey, JSON.stringify(next)) } catch { /* 儲存不可用時仍可正常搜尋 */ }
    close()
    navigate(`/stock/${symbol}`)
  }

  useEffect(() => {
    const clickOutside = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query), 180); return () => window.clearTimeout(timer) }, [query])
  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => mobileInputRef.current?.focus(), 50)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'Tab') {
        const focusable: HTMLElement[] = [mobileInputRef.current, closeRef.current].filter((item): item is HTMLInputElement | HTMLButtonElement => item !== null)
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; previous?.focus() }
  }, [mobileOpen])

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { close(); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, results.length - 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)) }
    if (event.key === 'Enter' && results[activeIndex]) select(results[activeIndex].symbol)
  }

  const searchInput = (mobile = false) => <div className="flex h-11 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-slate-400 focus-within:border-brand-400/40"><Search size={17} /><input ref={mobile ? mobileInputRef : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} className="w-full bg-transparent text-[15px] text-slate-100 outline-none placeholder:text-slate-500" placeholder="輸入股票代號或名稱" aria-label="搜尋股票" aria-expanded={open} role="combobox" /><span className="mono hidden text-xs text-slate-500 lg:block">⌘K</span></div>

  return <div ref={rootRef} className={`relative ${hero ? 'w-full' : ''}`}>
    <div className={`hidden md:block ${hero ? 'w-full' : 'w-72'}`}>{searchInput()}{open && <ResultPanel query={query} results={results} activeIndex={activeIndex} onHover={setActiveIndex} onSelect={select} />}</div>
    <button type="button" onClick={() => { setMobileOpen(true); setOpen(true) }} className={`min-h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-400 md:hidden ${hero ? 'flex w-full items-center gap-2.5 px-3 text-left text-sm' : 'icon-button grid place-items-center'}`} aria-label="開啟股票搜尋"><Search size={18} />{hero && <span>輸入股票代號或名稱</span>}</button>
    {mobileOpen && <section role="dialog" aria-modal="true" aria-label="全域股票搜尋" className="fixed inset-0 z-[90] overflow-y-auto bg-ink-950 px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] md:hidden">
      <div className="flex items-center gap-3"><button ref={closeRef} type="button" onClick={close} className="icon-button grid place-items-center rounded-xl border border-white/[0.08] text-slate-300" aria-label="返回並關閉股票搜尋"><ArrowLeft size={20} /></button><div className="flex-1">{searchInput(true)}</div><button type="button" onClick={close} className="icon-button grid place-items-center rounded-xl text-slate-300" aria-label="關閉股票搜尋"><X size={20} /></button></div>
      <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Clock3 size={15} />{query ? `搜尋結果 ${results.length} 筆` : recent.length ? '最近搜尋' : '熱門股票'}</div>
      <div className="mt-3"><ResultRows results={results} activeIndex={activeIndex} onHover={setActiveIndex} onSelect={select} /></div>
    </section>}
  </div>
}

function ResultPanel({ query, results, activeIndex, onHover, onSelect }: ResultProps & { query: string }) { return <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0d1317] shadow-2xl"><div className="border-b border-white/[0.06] px-4 py-2.5 text-xs text-slate-500">{query ? `找到 ${results.length} 筆結果` : '最近搜尋與熱門股票'}</div><div className="max-h-[420px] overflow-y-auto p-1.5"><ResultRows results={results} activeIndex={activeIndex} onHover={onHover} onSelect={onSelect} /></div></div> }

type ResultProps = { results: typeof stocks; activeIndex: number; onHover: (index: number) => void; onSelect: (symbol: string) => void }
function ResultRows({ results, activeIndex, onHover, onSelect }: ResultProps) { return results.length ? <>{results.map((stock, index) => <button type="button" key={stock.symbol} onMouseEnter={() => onHover(index)} onClick={() => onSelect(stock.symbol)} className={`grid min-h-[68px] w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 py-3 text-left transition ${index === activeIndex ? 'bg-brand-400/[0.08]' : 'hover:bg-white/[0.035]'}`}><div className="min-w-0"><div className="flex items-center gap-2"><span className="mono text-sm text-brand-300">{stock.symbol}</span><span className="truncate text-base font-medium text-white">{stock.name}</span></div><p className="mt-1 text-sm text-slate-500">{stock.industry}</p></div><div className="text-right"><p className="mono text-base text-slate-200">{formatStockPrice(stock.price)}</p><p className={`mono mt-1 text-sm ${stock.changePercent >= 0 ? 'text-red-300' : 'text-emerald-300'}`}>{stock.changePercent >= 0 ? '上漲 ' : '下跌 '}{formatSignedChange(stock.changePercent, '%')}</p></div></button>)}</> : <p className="px-4 py-10 text-center text-sm text-slate-500">沒有符合條件的股票</p> }

function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(recentKey) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 5) : []
  } catch { return [] }
}
