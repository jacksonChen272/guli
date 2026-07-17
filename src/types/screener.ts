import type { TechnicalFactorId } from '../config/technicalScoreFormula'

export type TechnicalDatasetStatus = 'official' | 'partial' | 'missing' | 'stale'
export type ScreenerRiskLevel = 'low' | 'medium' | 'high'
export type ScreenerPresetId = 'strong-trend' | 'breakout-volume' | 'macd-golden-cross' | 'institution-technical' | 'oversold-rebound' | 'low-volatility-trend' | 'high-volume-momentum' | 'defensive-watch' | 'high-risk-warning' | 'complete-data'

export interface TechnicalScoreFactor {
  id: TechnicalFactorId
  label: string
  score: number | null
  weight: number
  normalizedWeight: number
  contribution: number | null
  reasons: string[]
}

export interface TechnicalScoreResult {
  score: number | null
  label: '強勢' | '偏強' | '中性' | '偏弱' | '弱勢' | '資料不足'
  confidence: number
  availableWeight: number
  formulaVersion: 'technical-v1.0'
  factors: TechnicalScoreFactor[]
  warnings: string[]
}

export interface TechnicalIndexEntry {
  symbol: string
  name: string
  tradeDate: string
  historyRecordCount: number
  close: number | null
  change: number | null
  changePercent: number | null
  volume: number | null
  averageVolume20: number | null
  volumeRatio: number | null
  ma5: number | null
  ma10: number | null
  ma20: number | null
  ma60: number | null
  ma120: number | null
  rsi14: number | null
  k: number | null
  d: number | null
  macd: number | null
  macdSignal: number | null
  macdHistogram: number | null
  bollingerUpper: number | null
  bollingerMiddle: number | null
  bollingerLower: number | null
  atr14: number | null
  return20: number | null
  return60: number | null
  volatility20: number | null
  aboveMa20: boolean | null
  aboveMa60: boolean | null
  ma20Slope: number | null
  ma60Slope: number | null
  macdCrossDays: number | null
  kdImproving: boolean | null
  signalIds: string[]
  technicalScore: number | null
  technicalConfidence: number
  technicalLabel: TechnicalScoreResult['label']
  riskLevel: ScreenerRiskLevel
  source: 'TWSE Official History'
  status: TechnicalDatasetStatus
  warnings: string[]
}

export interface TechnicalIndexDataset {
  schemaVersion: '1.0'
  formulaVersion: 'technical-v1.0'
  tradeDate: string | null
  generatedAt: string
  source: 'TWSE Official History'
  sampleCount: number
  complete250Count: number
  scoreAvailableCount: number
  staleCount: number
  records: TechnicalIndexEntry[]
  warnings: string[]
}

export interface ScreenerPreset {
  id: ScreenerPresetId
  name: string
  description: string
  riskOnly?: boolean
}

export interface ScreenerResult {
  symbol: string
  name: string
  tradeDate: string
  presetId: ScreenerPresetId
  matched: boolean
  rank: number
  score: number | null
  confidence: number
  technicalScore: number | null
  decisionScore: number | null
  healthScore: number | null
  snapshotScore: number | null
  close: number | null
  changePercent: number | null
  rsi14: number | null
  macdHistogram: number | null
  volumeRatio: number | null
  aboveMa20: boolean | null
  aboveMa60: boolean | null
  k: number | null
  d: number | null
  return20: number | null
  return60: number | null
  volatility20: number | null
  historyRecordCount: number
  stale: boolean
  dateAlignmentStatus: DateAlignmentResult['status']
  institutionalNet: number | null
  riskLevel: ScreenerRiskLevel
  reasons: string[]
  risks: string[]
  matchedRules: string[]
  missingFields: string[]
  sourceSummary: string[]
  warnings: string[]
}

export interface ScreenerEvaluationContext {
  technical: TechnicalIndexEntry
  decisionScore: number | null
  healthScore: number | null
  snapshotScore: number | null
  institutionalNet: number | null
  institutionalTradeDate: string | null
  snapshotTradeDate: string | null
  decisionTradeDate: string | null
  dateAlignment: DateAlignmentResult
  sampleVolatilityMedian: number | null
}

export interface ScreenerPresetSummary {
  presetId: ScreenerPresetId
  name: string
  description: string
  matchedCount: number
  averageTechnicalScore: number | null
  averageConfidence: number | null
  completenessPercent: number
}

export interface ScreenerDataset {
  schemaVersion: '1.0'
  formulaVersion: 'screener-v1.0'
  tradeDate: string | null
  generatedAt: string
  technicalIndexGeneratedAt: string
  sampleCount: number
  complete250Count: number
  highRiskCount: number
  presets: ScreenerPresetSummary[]
  results: ScreenerResult[]
  warnings: string[]
}

export interface ScreenerFilters {
  technicalScoreMin?: number
  technicalScoreMax?: number
  decisionScoreMin?: number
  decisionScoreMax?: number
  rsiMin?: number
  rsiMax?: number
  volumeRatioMin?: number
  aboveMa20?: boolean
  aboveMa60?: boolean
  macdState?: 'positive' | 'negative'
  kdState?: 'bullish' | 'bearish'
  institutionalState?: 'buy' | 'sell'
  return20Min?: number
  return60Min?: number
  volatilityMax?: number
  completenessMin?: number
  stale?: boolean
  officialOnly?: boolean
  excludeHighRisk?: boolean
}

export interface DateSourceRecord {
  id: 'market' | 'stock' | 'institutional' | 'history' | 'snapshot' | 'decision' | 'technicalIndex'
  tradeDate: string | null
}

export interface DateAlignmentResult {
  status: 'aligned' | 'acceptable' | 'mismatched' | 'missing'
  referenceDate: string | null
  maxTradingDayGap: number | null
  confidencePenalty: number
  reasons: string[]
}
