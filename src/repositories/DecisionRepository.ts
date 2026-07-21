import { formulaVersion } from '../config/decisionFormula'
import { decisionEngine } from '../services/decision/DecisionEngine'
import { DecisionComparisonService } from '../services/decision/DecisionComparisonService'
import { calculateStockHealth } from '../services/stockHealthService'
import { useWatchlistStore } from '../stores/watchlistStore'
import type { DecisionComparison, DecisionEntityType, DecisionResult } from '../types/decision'
import type { DecisionDatasetSummary } from '../types/search'
import { IndustrySnapshotRepository } from './IndustrySnapshotRepository'
import type { InstitutionRepository } from './InstitutionRepository'
import { SnapshotRepository } from './SnapshotRepository'
import { StockSnapshotRepository } from './StockSnapshotRepository'
import type { StockRepository } from './StockRepository'

export class DecisionRepository {
  private cache = new Map<string, Promise<DecisionResult>>()
  private datasetSummary: DecisionDatasetSummary | null = null
  private comparison = new DecisionComparisonService()
  constructor(private readonly markets = new SnapshotRepository(), private readonly industries = new IndustrySnapshotRepository(), private readonly stocks = new StockSnapshotRepository(), private readonly stockData?: StockRepository, private readonly institutionData?: InstitutionRepository, private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis), private readonly baseUrl = import.meta.env.BASE_URL) {}
  private cached(key: string, producer: () => Promise<DecisionResult>) { const full = `${formulaVersion}:${key}`; const hit = this.cache.get(full); if (hit) return hit; const value = producer().catch((error) => { this.cache.delete(full); throw error }); this.cache.set(full, value); return value }
  getMarketDecision(date?: string) { return this.cached(`market:${date ?? 'latest'}`, async () => decisionEngine.market(date ? await this.markets.getByDate(date) : await this.markets.getLatest())) }
  getIndustryDecision(industryId: string, date?: string) { return this.cached(`industry:${industryId}:${date ?? 'latest'}`, async () => { const snapshot = date ? await this.industries.getByDate(date) : await this.industries.getLatest(); const item = snapshot.industries.find((entry) => entry.industryId === industryId); if (!item) throw new Error(`找不到產業決策資料：${industryId}`); return decisionEngine.industry(item, snapshot.tradeDate, snapshot.warnings) }) }
  getStockDecision(symbol: string, date?: string) { return this.cached(`stock:${symbol}:${date ?? 'latest'}`, async () => { const snapshot = await this.stocks.getBySymbol(symbol, date); const market = await this.getMarketDecision(snapshot.tradeDate).catch(() => null); const universe = this.stockData?.getSnapshot() ?? []; const mockStock = universe.find((item) => item.symbol === symbol); const health = mockStock ? calculateStockHealth(mockStock, universe) : null; let industry: DecisionResult | null = null; if (mockStock) { const industrySnapshot = await this.industries.getByDate(snapshot.tradeDate).catch(() => null); const matched = industrySnapshot?.industries.find((item) => item.industryName === mockStock.industry); if (matched && industrySnapshot) industry = decisionEngine.industry(matched, industrySnapshot.tradeDate, industrySnapshot.warnings) } const institutional = await this.institutionData?.getStockInstitutional(symbol) ?? null; return decisionEngine.stock(snapshot, health, market, industry, institutional) }) }
  getWatchlistDecision() { return this.cached('watchlist:current', async () => { const symbols = useWatchlistStore.getState().items.map((item) => item.symbol); const decisions = await Promise.all(symbols.map((symbol) => this.getStockDecision(symbol).catch(() => null))); return decisionEngine.watchlist(decisions.filter((item): item is DecisionResult => item !== null)) }) }
  async getDecisionComparison(entityType: DecisionEntityType, entityId: string, currentDate: string, previousDate?: string): Promise<DecisionComparison> { const dates = entityType === 'industry' ? await this.industries.getHistory(50).then((rows) => rows.map((row) => row.tradeDate)) : entityType === 'stock' ? await this.stocks.getAvailableDates() : await this.markets.getAvailableDates(); const previous = previousDate ?? dates.find((date) => date < currentDate); const get = (date: string) => entityType === 'market' ? this.getMarketDecision(date) : entityType === 'industry' ? this.getIndustryDecision(entityId, date) : entityType === 'stock' ? this.getStockDecision(entityId, date) : this.getWatchlistDecision(); const current = await get(currentDate); const prior = previous ? await get(previous).catch(() => undefined) : undefined; return this.comparison.compare(current, prior) }
  async getDatasetSummary(force = false): Promise<DecisionDatasetSummary> {
    if (!force && this.datasetSummary) return this.datasetSummary
    const response = await this.fetcher(`${this.baseUrl}data/decisions/latest.json`, { cache: 'no-cache', headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`Decision 資料摘要讀取失敗（HTTP ${response.status}）。`)
    const value: unknown = await response.json()
    if (!value || typeof value !== 'object') throw new Error('Decision 資料摘要格式不正確。')
    const summary = value as Partial<DecisionDatasetSummary>
    if (typeof summary.tradeDate !== 'string' || typeof summary.generatedAt !== 'string' || typeof summary.stockCount !== 'number' || !Number.isFinite(summary.stockCount)) throw new Error('Decision 資料摘要未通過驗證。')
    this.datasetSummary = { tradeDate: summary.tradeDate, generatedAt: summary.generatedAt, stockCount: Math.max(0, Math.trunc(summary.stockCount)) }
    return this.datasetSummary
  }
  clearCache() { this.cache.clear(); this.datasetSummary = null }
}
