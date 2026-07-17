export const technicalScoreFormulaVersion = 'technical-v1.0' as const

export const technicalScoreWeights = {
  trend: 0.30,
  momentum: 0.20,
  volume: 0.15,
  macd: 0.15,
  position: 0.10,
  risk: 0.10,
} as const

export type TechnicalFactorId = keyof typeof technicalScoreWeights

export const technicalScoreLabels = {
  trend: '趨勢結構',
  momentum: '動能',
  volume: '量能',
  macd: 'MACD',
  position: '相對位置',
  risk: '風險控制',
} satisfies Record<TechnicalFactorId, string>

export const classifyTechnicalScore = (score: number | null) => {
  if (score === null) return '資料不足' as const
  if (score >= 81) return '強勢' as const
  if (score >= 66) return '偏強' as const
  if (score >= 51) return '中性' as const
  if (score >= 36) return '偏弱' as const
  return '弱勢' as const
}
