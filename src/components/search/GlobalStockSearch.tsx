import { ArrowLeft, BarChart3, Clock3, Command, Search, Settings2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatSignedChange, formatStockPrice } from '../../lib/formatters'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { displayNumber } from '../../services/search/DataStatusService'
import { getSearchKeyboardAction, moveSearchSelection } from '../../services/search/SearchKeyboardService'
import type { RankedSearchResult, SearchDataState, SearchStockIndexItem, StockSearchPreview } from '../../types/search'
import { WatchlistButton } from '../watchlist/WatchlistButton'

const toDefaultResult = (item: SearchStockIndexItem, priority: 1 | 2): RankedSearchResult => ({ item, priority, matchedBy: priority === 1 ? '最近搜尋' : '熱門搜尋' })

export function GlobalStockSearch({ variant = 'topbar' }: { variant?: 'topbar' | 'hero' } = {}) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<RankedSearchResult[]>([])
  const [recent, setRecent] = useState<string[]>(() => repositoryHub.searchRepository.getRecentSymbols(10))
  const [open, setOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<StockSearchPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const paletteInputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()
  const navigate = useNavigate()
  const hero = variant === 'hero'
  const activeResult = results[activeIndex] ?? null

  const closePalette = () => {
    setPaletteOpen(false)
    setQuery('')
    setActiveIndex(0)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  const closeInline = () => { setOpen(false); setQuery(''); setActiveIndex(0) }

  const select = (result: RankedSearchResult) => {
    if (result.item.kind === 'stock') repositoryHub.searchRepository.recordRecent(result.item.symbol)
    setOpen(false)
    setPaletteOpen(false)
    setQuery('')
    setActiveIndex(0)
    navigate(result.item.kind === 'stock' ? `/stock/${result.item.symbol}` : result.item.path)
  }

  useEffect(() => repositoryHub.searchRepository.subscribeRecent(setRecent), [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 140)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let active = true
    setLoading(true)
    const load = async () => {
      if (debouncedQuery.trim()) return repositoryHub.searchRepository.search(debouncedQuery, 10)
      const [recentItems, popularItems] = await Promise.all([
        repositoryHub.searchRepository.resolveSymbols(recent),
        repositoryHub.searchRepository.getPopular(8),
      ])
      const seen = new Set<string>()
      return [
        ...recentItems.map((item) => toDefaultResult(item, 1)),
        ...popularItems.map((item) => toDefaultResult(item, 2)),
      ].filter((result) => result.item.kind !== 'stock' || (seen.has(result.item.symbol) ? false : (seen.add(result.item.symbol), true))).slice(0, 10)
    }
    void load().then((items) => { if (active) { setResults(items); setActiveIndex(0); setLoading(false) } }).catch(() => { if (active) { setResults([]); setLoading(false) } })
    return () => { active = false }
  }, [debouncedQuery, recent])

  useEffect(() => {
    if (activeResult?.item.kind !== 'stock') { setPreview(null); setPreviewLoading(false); return }
    let active = true
    setPreviewLoading(true)
    void repositoryHub.searchRepository.getPreview(activeResult.item)
      .then((value) => { if (active) setPreview(value) })
      .catch(() => { if (active) setPreview(null) })
      .finally(() => { if (active) setPreviewLoading(false) })
    return () => { active = false }
  }, [activeResult])

  useEffect(() => {
    const clickOutside = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  useEffect(() => {
    if (variant !== 'topbar') return
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(false)
        setPaletteOpen(true)
        window.setTimeout(() => paletteInputRef.current?.focus(), 30)
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [variant])

  useEffect(() => {
    if (!paletteOpen) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => paletteInputRef.current?.focus(), 30)
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') closePalette() }
    window.addEventListener('keydown', closeOnEscape)
    return () => { window.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = overflow; previous?.focus() }
  }, [paletteOpen])

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, palette = false) => {
    const action = getSearchKeyboardAction(event.key, event.shiftKey)
    if (action === 'none') return
    event.preventDefault()
    if (action === 'close') { palette ? closePalette() : closeInline(); return }
    if (action === 'select') { if (activeResult) select(activeResult); return }
    setActiveIndex((index) => moveSearchSelection(index, action, results.length))
  }

  const input = (palette = false) => <div className={`flex min-h-11 items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-slate-400 transition focus-within:border-brand-400/50 focus-within:ring-2 focus-within:ring-brand-400/10 ${palette ? 'min-h-14' : ''}`}>
    <Search size={palette ? 20 : 17}/>
    <input
      ref={palette ? paletteInputRef : undefined}
      value={query}
      onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); if (!palette) setOpen(true) }}
      onFocus={() => { if (!palette) setOpen(true) }}
      onKeyDown={(event) => onKeyDown(event, palette)}
      className="w-full bg-transparent text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
      placeholder="搜尋股票、代碼或功能"
      aria-label="全域智慧搜尋"
      aria-expanded={palette ? paletteOpen : open}
      aria-controls={listboxId}
      aria-activedescendant={activeResult ? `${listboxId}-${activeIndex}` : undefined}
      role="combobox"
      autoComplete="off"
    />
    {!palette && <span className="mono hidden whitespace-nowrap text-xs text-slate-500 lg:block">⌘K</span>}
  </div>

  return <div ref={rootRef} className={`relative ${hero ? 'w-full' : ''}`}>
    <div className={`hidden md:block ${hero ? 'w-full' : 'w-72'}`}>
      {input()}
      {open && <SearchPanel id={listboxId} query={query} results={results} activeIndex={activeIndex} loading={loading} preview={preview} previewLoading={previewLoading} align={hero ? 'left' : 'right'} onHover={setActiveIndex} onSelect={select}/>} 
    </div>
    <button ref={triggerRef} type="button" onClick={() => setPaletteOpen(true)} className={`min-h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:border-brand-400/30 hover:text-white md:hidden ${hero ? 'flex w-full items-center gap-2.5 px-3 text-left text-sm' : 'icon-button grid place-items-center'}`} aria-label="開啟智慧搜尋中心">
      <Search size={18}/>{hero && <span>搜尋股票、代碼或功能</span>}
    </button>
    {paletteOpen && <section role="dialog" aria-modal="true" aria-label="智慧搜尋中心" className="fixed inset-0 z-[100] overflow-y-auto bg-ink-950/98 px-3 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl sm:px-5 md:grid md:place-items-start md:bg-black/70 md:pt-[10vh]">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b1115] shadow-2xl md:max-h-[78vh]">
        <div className="flex items-center gap-3 border-b border-white/[0.07] p-3 sm:p-4">
          <button type="button" onClick={closePalette} className="icon-button grid shrink-0 place-items-center rounded-xl border border-white/[0.08] text-slate-300 md:hidden" aria-label="返回並關閉智慧搜尋"><ArrowLeft size={20}/></button>
          <div className="min-w-0 flex-1">{input(true)}</div>
          <button type="button" onClick={closePalette} className="icon-button grid shrink-0 place-items-center rounded-xl text-slate-300" aria-label="關閉智慧搜尋"><X size={20}/></button>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5 text-xs text-slate-500">
          <span className="flex items-center gap-2"><Command size={14}/>{query ? `搜尋「${query}」` : recent.length ? '最近搜尋與熱門項目' : '熱門搜尋'}</span>
          <span className="hidden sm:inline">↑↓／Tab 選擇 · Enter 開啟 · Esc 關閉</span>
        </div>
        <SearchPanel id={listboxId} query={query} results={results} activeIndex={activeIndex} loading={loading} preview={preview} previewLoading={previewLoading} palette onHover={setActiveIndex} onSelect={select}/>
      </div>
    </section>}
  </div>
}

interface SearchPanelProps {
  id: string
  query: string
  results: RankedSearchResult[]
  activeIndex: number
  loading: boolean
  preview: StockSearchPreview | null
  previewLoading: boolean
  palette?: boolean
  align?: 'left' | 'right'
  onHover: (index: number) => void
  onSelect: (result: RankedSearchResult) => void
}

function SearchPanel({ id, query, results, activeIndex, loading, preview, previewLoading, palette = false, align = 'left', onHover, onSelect }: SearchPanelProps) {
  const content = <div className={`${palette ? 'grid min-h-[420px] md:grid-cols-[minmax(0,1fr)_320px]' : 'grid md:grid-cols-[minmax(0,1fr)_290px]'}`}>
    <div className="min-w-0 border-white/[0.06] md:border-r">
      {!palette && <div className="border-b border-white/[0.06] px-4 py-2.5 text-xs text-slate-500">{query ? `找到 ${results.length} 筆結果` : '最近搜尋與熱門項目'}</div>}
      <div id={id} role="listbox" aria-label="搜尋結果" className={`${palette ? 'max-h-[58vh]' : 'max-h-[460px]'} overflow-y-auto p-2`}>
        {loading ? <SearchSkeleton/> : results.length ? results.map((result, index) => <SearchResultRow key={result.item.id} id={`${id}-${index}`} result={result} active={index === activeIndex} onHover={() => onHover(index)} onSelect={() => onSelect(result)}/>) : <div className="grid min-h-52 place-items-center px-5 text-center"><div><Search size={26} className="mx-auto text-slate-600"/><p className="mt-4 font-medium text-slate-200">找不到符合的股票或功能</p><p className="mt-2 text-sm text-slate-500">請確認股票代碼、名稱或改用其他關鍵字。</p></div></div>}
      </div>
    </div>
    <QuickPreview preview={preview} loading={previewLoading}/>
  </div>
  if (palette) return content
  return <div className={`absolute top-[calc(100%+8px)] z-50 w-[min(820px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b1115] shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}>{content}</div>
}

function SearchResultRow({ id, result, active, onHover, onSelect }: { id: string; result: RankedSearchResult; active: boolean; onHover: () => void; onSelect: () => void }) {
  if (result.item.kind === 'command') return <button id={id} role="option" aria-selected={active} type="button" onMouseEnter={onHover} onFocus={onHover} onClick={onSelect} className={`flex min-h-[72px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? 'bg-brand-400/[0.1] ring-1 ring-brand-400/20' : 'hover:bg-white/[0.035]'}`}>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-400/10 text-blue-300"><Settings2 size={18}/></span>
    <span className="min-w-0"><span className="block font-medium text-white">{result.item.label}</span><span className="mt-1 block truncate text-sm text-slate-500">{result.item.description}</span></span>
    <span className="mono ml-auto text-xs text-slate-600">{result.item.path}</span>
  </button>
  const stock = result.item
  return <button id={id} role="option" aria-selected={active} type="button" onMouseEnter={onHover} onFocus={onHover} onClick={onSelect} className={`min-h-[104px] w-full rounded-xl px-3 py-3 text-left transition ${active ? 'bg-brand-400/[0.1] ring-1 ring-brand-400/20' : 'hover:bg-white/[0.035]'}`}>
    <span className="flex min-w-0 items-start justify-between gap-3">
      <span className="min-w-0"><span className="flex items-center gap-2"><span className="mono text-sm text-brand-300">{stock.symbol}</span><span className="truncate font-medium text-white">{stock.name}</span><span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500">{stock.marketLabel}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{stock.industry} · {result.matchedBy}</span></span>
      <span className="shrink-0 text-right"><span className="mono block text-base text-slate-200">{displayNumber(stock.close, formatStockPrice)}</span><span className={`mono mt-1 block text-xs ${stock.changePercent === null ? 'text-slate-500' : stock.changePercent >= 0 ? 'text-red-300' : 'text-emerald-300'}`}>{stock.changePercent === null ? '漲跌等待資料' : `${stock.changePercent >= 0 ? '上漲 ' : '下跌 '}${formatSignedChange(stock.changePercent, '%')}`}</span></span>
    </span>
    <span className="mt-3 grid grid-cols-4 gap-1.5"><InlineScore label="Decision" value={stock.decisionScore}/><InlineScore label="Technical" value={stock.technicalScore}/><InlineScore label="Health" value={stock.healthScore}/><InlineScore label="Snapshot" value={stock.snapshotScore}/></span>
  </button>
}

function InlineScore({ label, value }: { label: string; value: number | null }) { return <span className="min-w-0 rounded-lg border border-white/[0.05] bg-black/10 px-1.5 py-1.5"><span className="block truncate text-[9px] text-slate-600">{label}</span><span className="mono mt-0.5 block text-xs text-slate-300">{value === null || !Number.isFinite(value) ? '等待' : value.toFixed(0)}</span></span> }

function QuickPreview({ preview, loading }: { preview: StockSearchPreview | null; loading: boolean }) {
  if (loading) return <aside aria-label="股票快速預覽載入中" className="hidden p-5 md:block"><SearchSkeleton rows={5}/></aside>
  if (!preview) return <aside aria-label="股票快速預覽" className="hidden place-items-center p-6 text-center md:grid"><div><BarChart3 size={28} className="mx-auto text-slate-600"/><p className="mt-3 text-sm text-slate-400">將游標移至股票</p><p className="mt-1 text-xs text-slate-600">可預覽行情、分數與資料狀態。</p></div></aside>
  return <aside aria-label={`${preview.stock.symbol} ${preview.stock.name} 快速預覽`} className="hidden overflow-y-auto p-5 md:block">
    <div className="flex items-start justify-between gap-3"><div><p className="mono text-xs text-brand-300">{preview.stock.symbol}</p><h3 className="mt-1 text-lg font-semibold text-white">{preview.stock.name}</h3><p className="mt-1 text-xs text-slate-500">{preview.stock.industry} · {preview.stock.marketLabel}</p></div><WatchlistButton symbol={preview.stock.symbol} compact/></div>
    <div className="mt-5 grid grid-cols-2 gap-2"><PreviewMetric label="最新價格" value={displayNumber(preview.stock.close, formatStockPrice)}/><PreviewMetric label="成交量" value={displayNumber(preview.volume, (value) => Math.round(value).toLocaleString('zh-TW'))}/></div>
    <div className="mt-4 grid grid-cols-2 gap-2"><PreviewScore label="Decision" score={preview.decision}/><PreviewScore label="Technical" score={preview.technical}/><PreviewScore label="Health" score={preview.health}/><PreviewScore label="Snapshot" score={preview.snapshot}/></div>
    <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4"><StatusRow label="Official Data" state={preview.officialData}/><StatusRow label="History" state={preview.history}/><StatusRow label="Technical" state={preview.technical.state}/><StatusRow label="Decision" state={preview.decision.state}/></div>
    <p className="mt-4 text-[11px] leading-5 text-slate-600">只有官方行情時，尚未完成的歷史與規則分數會顯示「等待資料」。</p>
  </aside>
}

function PreviewMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.06] p-3"><p className="text-[10px] text-slate-600">{label}</p><p className="mono mt-1 text-sm text-white">{value}</p></div> }
function PreviewScore({ label, score }: { label: string; score: StockSearchPreview['decision'] }) { return <div className="rounded-xl border border-white/[0.06] p-3"><p className="text-[10px] text-slate-600">{label}</p><p className="mono mt-1 text-lg text-white">{score.value === null || !Number.isFinite(score.value) ? '等待' : score.value.toFixed(0)}</p></div> }
function StatusRow({ label, state }: { label: string; state: SearchDataState }) { const text = state === 'available' ? 'Available' : state === 'waiting' ? 'Waiting' : 'Missing'; return <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-500">{label}</span><span className={state === 'available' ? 'text-brand-300' : state === 'waiting' ? 'text-amber-300' : 'text-slate-600'}>{text}</span></div> }
function SearchSkeleton({ rows = 4 }: { rows?: number }) { return <div role="status" aria-label="搜尋資料載入中" className="space-y-2 p-2">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-[76px] animate-pulse rounded-xl bg-white/[0.035]"/>)}</div> }
