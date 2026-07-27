import type { StockAnalysisData } from '../../hooks/useStockAnalysisData'
import type { StockRiskSeverity } from '../../types/stockRiskAssessment'

export type StockDisplayStatus = 'official' | 'derived' | 'partial' | 'stale' | 'missing'
export type StockScoreId = 'decision' | 'technical' | 'health' | 'risk' | 'snapshot'

export interface StockScoreCardViewModel {
  id: StockScoreId
  label: string
  value: number | null
  valueLabel: string
  statusLabel: string
  confidence: number | null
  description: string
  source: string
  tradeDate: string | null
  dataStatus: StockDisplayStatus
  scaleLabel: string
  statusReason: string | null
}

export interface StockCommandViewModel {
  headline: string
  stance: string
  trend: string
  institutional: string
  snapshot: string
  risk: string
  confidence: number | null
  positiveFactors: string[]
  neutralFactors: string[]
  riskFactors: string[]
  tradeDate: string | null
}

export interface StockHeaderBadgeViewModel {
  id: 'technical-ready' | 'partial-history' | 'high-volatility' | 'watchlisted'
  label: string
  tone: 'brand' | 'warning' | 'neutral'
}

export interface StockDataStatusItem {
  id: 'quote' | 'history' | 'technical' | 'decision' | 'snapshot' | 'institutional' | 'industry'
  label: string
  status: StockDisplayStatus
  statusLabel: string
  tradeDate: string | null
  detail: string
}

const finiteOrNull = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const scoreLabel = (value: number | null) => value === null ? '尚未取得' : value.toFixed(0)
const uniqueText = (items: string[]) => [...new Set(items.filter(Boolean))]

export function getRiskSeverity(
  data: Pick<StockAnalysisData, 'risks' | 'technicalIndex' | 'quote' | 'history'>,
): StockRiskSeverity | null {
  if (data.risks.some((risk) => risk.severity === 'high') || data.technicalIndex?.riskLevel === 'high') return 'high'
  if (data.risks.some((risk) => risk.severity === 'medium') || data.technicalIndex?.riskLevel === 'medium') return 'medium'
  if (data.quote || data.history || data.technicalIndex) return 'low'
  return null
}

const riskLabel = (severity: StockRiskSeverity | null) => {
  if (severity === 'high') return '高風險'
  if (severity === 'medium') return '中風險'
  if (severity === 'low') return '低風險'
  return '尚未取得'
}

export function buildStockScoreViewModel(data: StockAnalysisData): StockScoreCardViewModel[] {
  const decision = finiteOrNull(data.decision?.score)
  const technical = finiteOrNull(data.technicalIndex?.technicalScore)
  const health = finiteOrNull(data.health?.totalScore)
  const snapshot = finiteOrNull(data.snapshot?.snapshotScore)
  const risk = getRiskSeverity(data)

  return [
    {
      id: 'decision',
      label: 'GULI Decision',
      value: decision,
      valueLabel: scoreLabel(decision),
      statusLabel: data.decision?.label ?? '資料不足',
      confidence: finiteOrNull(data.decision?.confidence),
      description: data.decision?.summary ?? 'Decision 資料尚未取得。',
      source: data.decision?.trace.formulaVersion ?? 'Decision Missing',
      tradeDate: data.decision?.tradeDate ?? null,
      dataStatus: data.decision ? (data.stale ? 'stale' : 'derived') : 'missing',
      scaleLabel: '0–100 分',
      statusReason: data.decision
        ? (data.stale ? `資料日 ${data.decision.tradeDate}` : null)
        : 'Decision 尚未生成',
    },
    {
      id: 'technical',
      label: 'Technical Score',
      value: technical,
      valueLabel: scoreLabel(technical),
      statusLabel: data.technicalIndex?.technicalLabel ?? '資料不足',
      confidence: finiteOrNull(data.technicalIndex?.technicalConfidence),
      description: '沿用 technical-v1.0，整合趨勢、動能、量能與波動因子。',
      source: 'technical-v1.0',
      tradeDate: data.technicalIndex?.tradeDate ?? null,
      dataStatus: !data.technicalIndex
        ? 'missing'
        : data.technicalIndex.status === 'stale'
          ? 'stale'
          : data.technicalIndex.status === 'partial'
            ? 'partial'
            : 'derived',
      scaleLabel: '0–100 分',
      statusReason: !data.technicalIndex
        ? '歷史樣本不足或尚未生成'
        : data.technicalIndex.status === 'partial'
          ? `部分資料 · ${data.technicalIndex.historyRecordCount} 個交易日`
          : data.technicalIndex.status === 'stale'
            ? `資料日 ${data.technicalIndex.tradeDate}`
            : null,
    },
    {
      id: 'health',
      label: 'Health Score',
      value: health,
      valueLabel: scoreLabel(health),
      statusLabel: health === null
        ? '資料不足'
        : health >= 81
          ? '強勢'
          : health >= 66
            ? '偏多'
            : health >= 51
              ? '中性'
              : health >= 36
                ? '偏弱'
                : '弱勢',
      confidence: null,
      description: data.health?.summary ?? '健康分數尚未取得。',
      source: data.health ? '既有健康分數規則（含模擬因子）' : 'Health Missing',
      tradeDate: data.quote?.tradeDate ?? null,
      dataStatus: data.health ? 'partial' : 'missing',
      scaleLabel: '0–100 分',
      statusReason: data.health ? '含既有模擬因子' : '健康分數尚未取得',
    },
    {
      id: 'risk',
      label: 'Risk Level',
      value: null,
      valueLabel: riskLabel(risk),
      statusLabel: riskLabel(risk),
      confidence: null,
      description: data.risks[0]?.explanation ?? '目前未觸發既有固定風險規則；不代表沒有投資風險。',
      source: risk ? 'stock-risk-v1.0' : 'Risk Missing',
      tradeDate: data.dateConsistency.referenceDate,
      dataStatus: risk ? (data.stale ? 'stale' : 'derived') : 'missing',
      scaleLabel: '類別量尺，非百分制',
      statusReason: risk
        ? (data.stale
          ? `資料日 ${data.dateConsistency.referenceDate ?? '尚未取得'}`
          : `${data.risks.length} 項既有規則提醒`)
        : '風險資料尚未取得',
    },
    {
      id: 'snapshot',
      label: 'Snapshot Status',
      value: snapshot,
      valueLabel: scoreLabel(snapshot),
      statusLabel: data.snapshot?.status ?? '資料不足',
      confidence: null,
      description: '單日快照反映當日價格強度、流動性與估值風險。',
      source: data.snapshot ? 'Stock Snapshot v1.0' : 'Snapshot Missing',
      tradeDate: data.snapshot?.tradeDate ?? null,
      dataStatus: data.snapshot ? (data.stale ? 'stale' : 'derived') : 'missing',
      scaleLabel: '0–100 分',
      statusReason: data.snapshot
        ? (data.stale ? `資料日 ${data.snapshot.tradeDate}` : null)
        : 'Snapshot 尚未生成',
    },
  ]
}

export function buildStockCommandViewModel(data: StockAnalysisData): StockCommandViewModel {
  const institutionalNet = finiteOrNull(data.institutional.record?.totalNetShares)
  const institutional = institutionalNet === null
    ? '法人資料尚未取得'
    : institutionalNet > 0
      ? '三大法人單日買超'
      : institutionalNet < 0
        ? '三大法人單日賣超'
        : '三大法人單日持平'

  return {
    headline: data.narrative.headline,
    stance: data.narrative.stance,
    trend: data.priceStructure?.trend.classification ?? '資料不足',
    institutional,
    snapshot: data.snapshot?.status ?? '資料不足',
    risk: riskLabel(getRiskSeverity(data)),
    confidence: finiteOrNull(data.decision?.confidence ?? data.narrative.confidence),
    positiveFactors: uniqueText(data.narrative.positiveFactors.map((factor) => factor.explanation)).slice(0, 4),
    neutralFactors: uniqueText(
      (data.decision?.factors ?? [])
        .filter((factor) => factor.direction === 'neutral')
        .map((factor) => factor.explanation),
    ).slice(0, 2),
    riskFactors: uniqueText(data.narrative.riskFactors.map((factor) => factor.explanation)).slice(0, 3),
    tradeDate: data.narrative.tradeDate,
  }
}

export function buildStockHeaderBadges(data: StockAnalysisData): StockHeaderBadgeViewModel[] {
  const badges: StockHeaderBadgeViewModel[] = []
  if (data.technicalIndex) badges.push({ id: 'technical-ready', label: 'Technical Ready', tone: 'brand' })
  if (data.history?.status === 'partial') badges.push({ id: 'partial-history', label: 'Partial History', tone: 'warning' })
  if (data.risks.some((risk) => risk.category === 'volatility')) {
    badges.push({ id: 'high-volatility', label: '高波動', tone: 'warning' })
  }
  if (data.isWatchlisted) badges.push({ id: 'watchlisted', label: '已加入自選', tone: 'neutral' })
  return badges.slice(0, 4)
}

export function buildStockDataStatusViewModel(data: StockAnalysisData): StockDataStatusItem[] {
  const historyStatus: StockDisplayStatus = !data.history
    ? 'missing'
    : data.history.status === 'stale' || data.stale
      ? 'stale'
      : 'official'
  const technicalStatus: StockDisplayStatus = !data.technicalIndex
    ? 'missing'
    : data.technicalIndex.status === 'stale'
      ? 'stale'
      : data.technicalIndex.status === 'partial'
        ? 'partial'
        : 'derived'

  return [
    {
      id: 'quote',
      label: '官方行情',
      status: data.quote ? 'official' : 'missing',
      statusLabel: data.quote ? 'Official' : 'Missing',
      tradeDate: data.quote?.tradeDate ?? null,
      detail: data.quote ? 'TWSE 官方盤後行情' : '尚未取得官方行情',
    },
    {
      id: 'history',
      label: '歷史資料',
      status: historyStatus,
      statusLabel: historyStatus === 'official' ? 'Official' : historyStatus === 'stale' ? 'Stale' : 'Missing',
      tradeDate: data.history?.lastTradeDate ?? null,
      detail: data.history ? `${data.history.recordCount} 個交易日` : '尚未完成歷史回補',
    },
    {
      id: 'technical',
      label: '技術資料',
      status: technicalStatus,
      statusLabel: technicalStatus === 'derived'
        ? 'Derived'
        : technicalStatus === 'partial'
          ? 'Partial'
          : technicalStatus === 'stale'
            ? 'Stale'
            : 'Missing',
      tradeDate: data.technicalIndex?.tradeDate ?? null,
      detail: data.technicalIndex ? 'technical-v1.0 規則推導' : '歷史樣本不足或尚未生成',
    },
    {
      id: 'decision',
      label: 'Decision',
      status: data.decision ? 'derived' : 'missing',
      statusLabel: data.decision ? 'Derived' : 'Missing',
      tradeDate: data.decision?.tradeDate ?? null,
      detail: data.decision?.trace.formulaVersion ?? '尚未生成 Decision',
    },
    {
      id: 'institutional',
      label: '法人資料',
      status: data.institutional.record ? 'official' : 'missing',
      statusLabel: data.institutional.record ? 'Official' : 'Missing',
      tradeDate: data.institutional.record?.tradeDate ?? null,
      detail: data.institutional.record ? 'TWSE 官方三大法人盤後資料' : '尚未取得官方法人資料',
    },
    {
      id: 'industry',
      label: '產業資料',
      status: data.industryMapping ? (data.industrySnapshot ? 'derived' : 'official') : 'missing',
      statusLabel: data.industryMapping ? (data.industrySnapshot ? 'Derived' : 'Official') : 'Missing',
      tradeDate: data.industrySnapshot?.sources
        .map((source) => source.tradeDate)
        .filter((value): value is string => Boolean(value))
        .at(-1)
        ?? data.industryMapping?.updatedAt?.slice(0, 10)
        ?? null,
      detail: data.industryMapping?.industryName ?? '尚未取得產業分類',
    },
    {
      id: 'snapshot',
      label: 'Snapshot',
      status: data.snapshot ? 'derived' : 'missing',
      statusLabel: data.snapshot ? 'Derived' : 'Missing',
      tradeDate: data.snapshot?.tradeDate ?? null,
      detail: data.snapshot ? '單日規則快照' : '尚未生成 Snapshot',
    },
  ]
}
