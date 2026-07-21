import { rankSearchCandidates, normalizeSearchText } from '../services/search/SearchRankingService'
import type { RankedSearchResult, SearchCommandIndexItem, SearchIndexItem, SearchIndexSnapshot, SearchStockIndexItem } from '../types/search'
import type { RecentSearchRepository } from './RecentSearchRepository'
import type { StockDataStatusRepository } from './StockDataStatusRepository'

const DEFAULT_POPULAR_SYMBOLS = ['2330', '2454', '2615', '2324', '2317', '2303']

export const DEFAULT_SEARCH_COMMANDS: SearchCommandIndexItem[] = [
  { kind: 'command', id: 'command:dashboard', label: '市場總覽', description: '回到今日市場首頁', path: '/', keywords: ['Dashboard', '首頁', '市場'], popularityScore: 100 },
  { kind: 'command', id: 'command:history', label: '市場回顧', description: '查看市場歷史與快照', path: '/history', keywords: ['市場歷史', 'History', '回顧'], popularityScore: 90 },
  { kind: 'command', id: 'command:screener', label: '智慧選股', description: '使用固定規則篩選股票', path: '/screener', keywords: ['Screener', '選股'], popularityScore: 88 },
  { kind: 'command', id: 'command:industries', label: '產業分析', description: '查看產業強弱與輪動', path: '/industries', keywords: ['Industry', '產業'], popularityScore: 86 },
  { kind: 'command', id: 'command:watchlist', label: '我的自選股', description: '開啟智慧觀察中心', path: '/watchlist', keywords: ['自選股', 'Watchlist', '自選'], popularityScore: 84 },
  { kind: 'command', id: 'command:decisions', label: '決策中心', description: '查看規則判讀與追溯資料', path: '/decisions', keywords: ['Decision', '決策'], popularityScore: 80 },
  { kind: 'command', id: 'command:capital-flow', label: '資金輪動', description: '查看市場資金輪動', path: '/capital-flow', keywords: ['Capital Flow', '資金'], popularityScore: 78 },
  { kind: 'command', id: 'command:settings', label: '設定', description: '資料來源與系統設定', path: '/settings', keywords: ['Settings', '系統設定'], popularityScore: 76 },
]

const addToMap = (map: Map<string, Set<string>>, key: string, id: string) => {
  if (!key) return
  const values = map.get(key) ?? new Set<string>()
  values.add(id)
  map.set(key, values)
}

const indexSubstrings = (map: Map<string, Set<string>>, rawValue: string, id: string) => {
  const value = normalizeSearchText(rawValue)
  for (let start = 0; start < value.length; start += 1) {
    for (let end = start + 1; end <= value.length; end += 1) addToMap(map, value.slice(start, end), id)
  }
}

export class SearchRepository {
  private snapshotPromise: Promise<SearchIndexSnapshot> | null = null
  private readonly byId = new Map<string, SearchIndexItem>()
  private readonly exactCode = new Map<string, Set<string>>()
  private readonly codePrefix = new Map<string, Set<string>>()
  private readonly namePrefix = new Map<string, Set<string>>()
  private readonly contains = new Map<string, Set<string>>()
  private readonly characterIndex = new Map<string, Set<string>>()

  constructor(
    private readonly statusRepository: StockDataStatusRepository,
    private readonly recentRepository: RecentSearchRepository,
    private readonly commands: SearchCommandIndexItem[] = DEFAULT_SEARCH_COMMANDS,
  ) {}

  private clearIndexMaps() {
    this.byId.clear()
    this.exactCode.clear()
    this.codePrefix.clear()
    this.namePrefix.clear()
    this.contains.clear()
    this.characterIndex.clear()
  }

  private async build(): Promise<SearchIndexSnapshot> {
    const source = await this.statusRepository.getIndexData()
    this.clearIndexMaps()
    const popularRank = new Map(DEFAULT_POPULAR_SYMBOLS.map((symbol, index) => [symbol, DEFAULT_POPULAR_SYMBOLS.length - index]))
    const items = source.records.map<SearchStockIndexItem>((record) => ({
      kind: 'stock',
      id: `stock:${record.symbol}`,
      symbol: record.symbol,
      name: record.name,
      englishName: record.englishName,
      industry: record.industry ?? '產業資料等待中',
      market: 'TWSE',
      marketLabel: '上市',
      close: record.close,
      changePercent: record.changePercent,
      tradeVolume: record.tradeVolume,
      tradeValue: record.tradeValue,
      hasOfficialQuote: record.hasOfficialQuote,
      hasHistory: record.hasHistory,
      hasTechnical: record.hasTechnical,
      hasDecision: record.hasDecision,
      hasSnapshot: record.hasSnapshot,
      decisionScore: record.decisionScore,
      technicalScore: record.technicalScore,
      healthScore: record.healthScore,
      snapshotScore: record.snapshotScore,
      popularityScore: (popularRank.get(record.symbol) ?? 0) * 1_000_000 + Math.log10(Math.max(record.tradeValue ?? 0, 1)) * 100,
      tradeDate: record.tradeDate,
    }))
    for (const item of [...items, ...this.commands]) {
      this.byId.set(item.id, item)
      if (item.kind === 'command') continue
      const symbol = normalizeSearchText(item.symbol)
      const name = normalizeSearchText(item.name)
      const english = normalizeSearchText(item.englishName ?? '')
      addToMap(this.exactCode, symbol, item.id)
      for (let index = 1; index <= symbol.length; index += 1) addToMap(this.codePrefix, symbol.slice(0, index), item.id)
      for (const value of [name, english]) for (let index = 1; index <= value.length; index += 1) addToMap(this.namePrefix, value.slice(0, index), item.id)
      indexSubstrings(this.contains, item.name, item.id)
      indexSubstrings(this.contains, item.englishName ?? '', item.id)
      indexSubstrings(this.contains, item.industry, item.id)
      for (const character of new Set(`${name}${english}${symbol}`)) addToMap(this.characterIndex, character, item.id)
    }
    return { items, commands: this.commands, builtAt: source.builtAt, tradeDate: source.tradeDate, coverage: source.coverage }
  }

  initialize(force = false) {
    if (force) { this.snapshotPromise = null; this.statusRepository.clearCache() }
    this.snapshotPromise ??= this.build().catch((error) => { this.snapshotPromise = null; throw error })
    return this.snapshotPromise
  }

  private candidateIds(rawQuery: string) {
    const query = normalizeSearchText(rawQuery)
    const ids = new Set<string>()
    const collect = (values?: Set<string>) => values?.forEach((id) => ids.add(id))
    collect(this.exactCode.get(query))
    collect(this.codePrefix.get(query))
    collect(this.namePrefix.get(query))
    collect(this.contains.get(query))
    if (!ids.size) for (const character of new Set(query)) collect(this.characterIndex.get(character))
    return ids
  }

  async search(query: string, limit = 10): Promise<RankedSearchResult[]> {
    const snapshot = await this.initialize()
    const value = normalizeSearchText(query)
    if (!value) return []
    const candidateIds = this.candidateIds(value)
    const stocks = [...candidateIds].map((id) => this.byId.get(id)).filter((item): item is SearchStockIndexItem => item?.kind === 'stock')
    const commandCandidates = snapshot.commands.filter((command) => [command.label, command.path, ...command.keywords].some((term) => normalizeSearchText(term).includes(value) || value.includes(normalizeSearchText(term))))
    return rankSearchCandidates(value, [...stocks, ...commandCandidates], limit)
  }

  async getPopular(limit = 6) {
    const snapshot = await this.initialize()
    return [...snapshot.items].sort((left, right) => right.popularityScore - left.popularityScore || left.symbol.localeCompare(right.symbol)).slice(0, Math.max(0, limit))
  }

  async getBySymbol(symbol: string) { return (await this.initialize()).items.find((item) => item.symbol === symbol) ?? null }

  async resolveSymbols(symbols: string[]) {
    const snapshot = await this.initialize()
    const bySymbol = new Map(snapshot.items.map((item) => [item.symbol, item]))
    return symbols.map((symbol) => bySymbol.get(symbol)).filter((item): item is SearchStockIndexItem => Boolean(item))
  }

  getRecentSymbols(limit = 10) { return this.recentRepository.getRecent(limit) }
  recordRecent(symbol: string) { return this.recentRepository.record(symbol) }
  clearRecent() { this.recentRepository.clear() }
  subscribeRecent(listener: (symbols: string[]) => void) { return this.recentRepository.subscribe(listener) }
  getCoverage(force = false) { return this.statusRepository.getCoverage(force) }
  getPreview(stock: SearchStockIndexItem, force = false) { return this.statusRepository.getPreview(stock, force) }
}
