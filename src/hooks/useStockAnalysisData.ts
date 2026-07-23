import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { repositoryHub } from '../repositories/RepositoryHub'
import { marketRepository } from '../services/dataRepository'
import { calculateSupportResistanceFromHistory } from '../services/priceStructure/SupportResistanceService'
import { assessStockRisks } from '../services/stockRisk/StockRiskAssessmentService'
import { generateStockNarrative } from '../services/stockNarrative/StockNarrativeService'
import { isHistoryStale } from '../services/stockHistory/StockHistoryValidator'
import { calculateStockHealth } from '../services/stockHealthService'
import { calculateTechnicalIndicators } from '../services/technical/TechnicalIndicatorService'
import { useWatchlistStore } from '../stores/watchlistStore'
import type { DecisionResult } from '../types/decision'
import type { StockHealthResult } from '../types/insight'
import type { IndustrySnapshotItem } from '../types/industrySnapshot'
import type { OfficialIndustryStock } from '../types/officialIndustryMapping'
import type { OfficialStockInstitutionalRecord } from '../types/officialInstitutionalData'
import type { OfficialStockDailyRecord } from '../types/officialStockData'
import type { OfficialStockHistory } from '../types/officialStockHistory'
import type { TechnicalIndexEntry } from '../types/screener'
import type { Stock } from '../types/stock'
import type { StockNarrativeResult } from '../types/stockNarrative'
import type { StockRiskAssessmentItem } from '../types/stockRiskAssessment'
import type { StockSnapshotItem } from '../types/stockSnapshot'
import type { SupportResistanceAnalysis } from '../types/supportResistance'
import type { TechnicalIndicatorSeries } from '../types/technicalIndicator'

export type StockAnalysisLoadStatus = 'loading' | 'success' | 'partial' | 'error'

export interface StockDateConsistency {
  status: 'aligned' | 'mixed' | 'missing'
  referenceDate: string | null
  dates: Array<{ id: string; label: string; tradeDate: string | null }>
  mismatched: boolean
}

interface InstitutionalContext {
  record: OfficialStockInstitutionalRecord | null
  netVolumePercent: number | null
  percentile: number | null
}

interface LoadedStockAnalysisData {
  stock: Stock | null
  quote: OfficialStockDailyRecord | null
  history: OfficialStockHistory | null
  technicalIndex: TechnicalIndexEntry | null
  decision: DecisionResult | null
  snapshot: StockSnapshotItem | null
  institutional: InstitutionalContext
  industryMapping: OfficialIndustryStock | null
  industrySnapshot: IndustrySnapshotItem | null
  errors: string[]
  warnings: string[]
}

export interface StockAnalysisData extends LoadedStockAnalysisData {
  status: StockAnalysisLoadStatus
  name: string
  historyUrl: string
  health: StockHealthResult | null
  indicators: TechnicalIndicatorSeries | null
  priceStructure: SupportResistanceAnalysis | null
  narrative: StockNarrativeResult
  risks: StockRiskAssessmentItem[]
  dateConsistency: StockDateConsistency
  stale: boolean
  isWatchlisted: boolean
  toggleWatchlist: () => void
  reload: () => void
}

const emptyLoaded = (): LoadedStockAnalysisData => ({ stock: null, quote: null, history: null, technicalIndex: null, decision: null, snapshot: null, institutional: { record: null, netVolumePercent: null, percentile: null }, industryMapping: null, industrySnapshot: null, errors: [], warnings: [] })

const resultValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T => result.status === 'fulfilled' ? result.value : fallback
const resultError = (result: PromiseSettledResult<unknown>, label: string) => result.status === 'rejected' ? `${label}：${result.reason instanceof Error ? result.reason.message : '讀取失敗'}` : null

export function buildDateConsistency(rows: StockDateConsistency['dates']): StockDateConsistency {
  const available = rows.map((row) => row.tradeDate).filter((value): value is string => Boolean(value))
  const unique = [...new Set(available)]
  return { status: !available.length ? 'missing' : unique.length === 1 ? 'aligned' : 'mixed', referenceDate: available.sort().at(-1) ?? null, dates: rows, mismatched: unique.length > 1 }
}

export function useStockAnalysisData(symbol: string): StockAnalysisData {
  const normalizedSymbol = symbol.trim()
  const [loaded, setLoaded] = useState<LoadedStockAnalysisData>(emptyLoaded)
  const [status, setStatus] = useState<StockAnalysisLoadStatus>('loading')
  const [revision, setRevision] = useState(0)
  const requestId = useRef(0)
  const isWatchlisted = useWatchlistStore((state) => state.items.some((item) => item.symbol === normalizedSymbol))
  const toggle = useWatchlistStore((state) => state.toggle)
  const stock = useMemo(() => marketRepository.getStock(normalizedSymbol) ?? null, [normalizedSymbol])
  const universe = useMemo(() => marketRepository.getStocks(), [])

  useEffect(() => {
    const currentRequest = ++requestId.current
    setStatus('loading')
    setLoaded({ ...emptyLoaded(), stock })
    const load = async () => {
      const quotePromise = repositoryHub.stocks.getOfficialQuote(normalizedSymbol)
      const historyPromise = repositoryHub.stockHistory.getHistory(normalizedSymbol)
      const technicalPromise = repositoryHub.screener.getTechnicalIndex().then((dataset) => dataset.records.find((record) => record.symbol === normalizedSymbol) ?? null)
      const decisionPromise = repositoryHub.decisions.getStockDecision(normalizedSymbol)
      const snapshotPromise = repositoryHub.stockSnapshots.getBySymbol(normalizedSymbol)
      const mappingPromise = repositoryHub.industryMapping.getBySymbol(normalizedSymbol)
      const industrySnapshotPromise = Promise.all([mappingPromise, repositoryHub.industrySnapshots.getLatest()]).then(([mapping, snapshot]) => mapping?.industryCode ? snapshot.industries.find((item) => item.industryId === mapping.industryCode || item.industryName === mapping.industryName) ?? null : null)
      const first = await Promise.allSettled([quotePromise, historyPromise, technicalPromise, decisionPromise, snapshotPromise, mappingPromise, industrySnapshotPromise] as const)
      const quote = resultValue(first[0], undefined) ?? null
      const history = resultValue(first[1], null)
      const technicalIndex = resultValue(first[2], null)
      const decision = resultValue(first[3], null)
      const snapshot = resultValue(first[4], null)
      const industryMapping = resultValue(first[5], null)
      const industrySnapshot = resultValue(first[6], null)
      const institutionResult = await Promise.allSettled([repositoryHub.institutions.getStockInstitutionalContext(normalizedSymbol, quote?.tradeVolume ?? null)] as const)
      const institutional = resultValue(institutionResult[0], { record: null, netVolumePercent: null, percentile: null })
      const errors = [
        resultError(first[0], '官方行情'), resultError(first[1], '官方歷史'), resultError(first[2], '技術索引'), resultError(first[3], 'Decision'), resultError(first[4], '單日快照'), resultError(first[5], '產業分類'), resultError(first[6], '產業比較'), resultError(institutionResult[0], '法人資料'),
      ].filter((value): value is string => Boolean(value))
      const warnings = [...new Set([...(quote?.warnings ?? []), ...(history?.warnings ?? []), ...(technicalIndex?.warnings ?? []), ...(decision?.warnings ?? []), ...(snapshot?.warnings ?? []), ...(institutional.record?.warnings ?? [])])]
      if (currentRequest !== requestId.current) return
      const essentialAvailable = Boolean(quote || history)
      setLoaded({ stock, quote, history, technicalIndex, decision, snapshot, institutional, industryMapping, industrySnapshot, errors, warnings })
      setStatus(!essentialAvailable ? 'error' : errors.length || !quote || !history || !technicalIndex || !decision || !snapshot ? 'partial' : 'success')
    }
    void load()
    return () => { requestId.current += 1 }
  }, [normalizedSymbol, revision, stock])

  const indicators = useMemo(() => loaded.history ? calculateTechnicalIndicators(loaded.history.prices) : null, [loaded.history])
  const priceStructure = useMemo(() => indicators ? calculateSupportResistanceFromHistory(indicators) : null, [indicators])
  const health = useMemo(() => loaded.stock ? calculateStockHealth(loaded.stock, universe) : null, [loaded.stock, universe])
  const dateConsistency = useMemo(() => buildDateConsistency([
    { id: 'quote', label: '官方行情', tradeDate: loaded.quote?.tradeDate ?? null },
    { id: 'history', label: '歷史行情', tradeDate: loaded.history?.lastTradeDate ?? null },
    { id: 'technical', label: '技術索引', tradeDate: loaded.technicalIndex?.tradeDate ?? null },
    { id: 'decision', label: 'Decision', tradeDate: loaded.decision?.tradeDate ?? null },
    { id: 'snapshot', label: '單日快照', tradeDate: loaded.snapshot?.tradeDate ?? null },
    { id: 'institutional', label: '法人', tradeDate: loaded.institutional.record?.tradeDate ?? null },
  ]), [loaded])
  const stale = Boolean((loaded.history && isHistoryStale(loaded.history.lastTradeDate)) || loaded.technicalIndex?.status === 'stale')
  const risks = useMemo(() => assessStockRisks({
    tradeDate: dateConsistency.referenceDate,
    close: loaded.quote?.close ?? indicators?.prices.at(-1)?.close ?? null,
    rsi14: indicators?.rsi14.at(-1)?.value ?? null,
    k: indicators?.stochastic.at(-1)?.k ?? null,
    d: indicators?.stochastic.at(-1)?.d ?? null,
    atr14: indicators?.atr14.at(-1)?.value ?? null,
    volatility20: indicators?.volatility20.at(-1)?.value ?? null,
    volumeRatio: indicators?.volumeRatio20.at(-1)?.value ?? null,
    ma20: indicators?.ma20.at(-1)?.value ?? null,
    ma60: indicators?.ma60.at(-1)?.value ?? null,
    nearestResistanceDistancePercent: priceStructure?.resistances[0]?.distancePercent ?? null,
    institutionalNetShares: loaded.institutional.record?.totalNetShares ?? null,
    industryStrength: loaded.industrySnapshot?.strengthScore ?? null,
    decisionScore: loaded.decision?.score ?? null,
    technicalScore: loaded.technicalIndex?.technicalScore ?? null,
    dateMismatch: dateConsistency.mismatched,
    stale,
    historyRecordCount: loaded.history?.recordCount ?? 0,
  }), [dateConsistency, indicators, loaded, priceStructure, stale])
  const narrative = useMemo(() => generateStockNarrative({
    symbol: normalizedSymbol,
    name: loaded.quote?.name ?? loaded.history?.name ?? loaded.stock?.name ?? normalizedSymbol,
    tradeDate: dateConsistency.referenceDate,
    decisionScore: loaded.decision?.score ?? null,
    technicalScore: loaded.technicalIndex?.technicalScore ?? null,
    healthScore: health?.totalScore ?? null,
    snapshotScore: loaded.snapshot?.snapshotScore ?? null,
    close: loaded.quote?.close ?? indicators?.prices.at(-1)?.close ?? null,
    ma20: indicators?.ma20.at(-1)?.value ?? null,
    ma60: indicators?.ma60.at(-1)?.value ?? null,
    rsi14: indicators?.rsi14.at(-1)?.value ?? null,
    macdHistogram: indicators?.macd.at(-1)?.histogram ?? null,
    volumeRatio: indicators?.volumeRatio20.at(-1)?.value ?? null,
    institutionalNetShares: loaded.institutional.record?.totalNetShares ?? null,
    industryRelativeStrength: loaded.industrySnapshot?.relativeStrengthScore ?? null,
    highRiskCount: risks.filter((risk) => risk.severity === 'high').length,
    stale,
  }), [dateConsistency.referenceDate, health, indicators, loaded, normalizedSymbol, risks, stale])
  const reload = useCallback(() => {
    repositoryHub.stockHistory.clearCache(normalizedSymbol)
    repositoryHub.screener.clearCache()
    repositoryHub.decisions.clearCache()
    setRevision((value) => value + 1)
  }, [normalizedSymbol])

  return {
    ...loaded,
    status,
    name: loaded.quote?.name ?? loaded.history?.name ?? loaded.stock?.name ?? normalizedSymbol,
    historyUrl: repositoryHub.stockHistory.getResolvedUrl(normalizedSymbol),
    health,
    indicators,
    priceStructure,
    narrative,
    risks,
    dateConsistency,
    stale,
    isWatchlisted,
    toggleWatchlist: () => toggle(normalizedSymbol),
    reload,
  }
}
