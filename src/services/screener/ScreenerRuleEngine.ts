import type { ScreenerEvaluationContext, ScreenerPresetId, ScreenerResult } from '../../types/screener'
import { explainTechnicalContext } from './ScreenerExplanationService'

type RuleEvaluation = { matched: boolean; rules: string[]; missing: string[] }
const present = (value: unknown): boolean => value !== null && value !== undefined

function evaluatePreset(id: ScreenerPresetId, context: ScreenerEvaluationContext): RuleEvaluation {
  const item = context.technical
  const missing: string[] = []
  const need = (field: keyof typeof item) => { if (!present(item[field])) missing.push(String(field)); return present(item[field]) }
  let matched = false
  const rules: string[] = []
  if (id === 'strong-trend') {
    const ready = ['close', 'ma20', 'ma60', 'ma20Slope', 'rsi14', 'technicalScore'].every((field) => need(field as keyof typeof item))
    matched = ready && item.close! > item.ma20! && item.ma20! > item.ma60! && item.ma20Slope! > 0 && item.rsi14! >= 55 && item.rsi14! <= 75 && item.technicalScore! >= 70
    rules.push('close > MA20', 'MA20 > MA60', 'MA20 slope > 0', 'RSI 55–75', 'Technical Score ≥ 70')
  } else if (id === 'breakout-volume') {
    const ready = ['aboveMa20', 'volumeRatio', 'changePercent', 'macdHistogram'].every((field) => need(field as keyof typeof item))
    matched = ready && item.aboveMa20 === true && item.volumeRatio! >= 1.5 && item.changePercent! > 0 && item.macdHistogram! > 0
    rules.push('收盤站上 MA20', '量比 ≥ 1.5', '單日漲幅 > 0', 'MACD 柱狀體為正')
  } else if (id === 'macd-golden-cross') {
    const ready = ['macdCrossDays', 'aboveMa20', 'rsi14'].every((field) => need(field as keyof typeof item))
    matched = ready && item.macdCrossDays! >= 0 && item.macdCrossDays! <= 3 && item.aboveMa20 === true && item.rsi14! < 80
    rules.push('近 3 日 MACD 黃金交叉', '收盤 ≥ MA20', 'RSI < 80')
  } else if (id === 'institution-technical') {
    const ready = ['technicalScore', 'aboveMa20'].every((field) => need(field as keyof typeof item)) && present(context.institutionalNet)
    if (!present(context.institutionalNet)) missing.push('institutionalNet')
    matched = ready && context.institutionalNet! > 0 && item.aboveMa20 === true && item.technicalScore! >= 60 && ['aligned', 'acceptable'].includes(context.dateAlignment.status)
    rules.push('官方法人合計買超', 'close > MA20', 'Technical Score ≥ 60', '資料日期差 ≤ 1 交易日')
  } else if (id === 'oversold-rebound') {
    const ready = ['rsi14', 'kdImproving', 'close', 'bollingerLower'].every((field) => need(field as keyof typeof item))
    matched = ready && item.rsi14! <= 35 && item.kdImproving === true && item.close! >= item.bollingerLower! * 0.97
    rules.push('RSI ≤ 35', 'KD 低檔改善', '未嚴重跌破布林下軌')
  } else if (id === 'low-volatility-trend') {
    const ready = ['ma20Slope', 'ma60Slope', 'volatility20', 'rsi14'].every((field) => need(field as keyof typeof item)) && present(context.sampleVolatilityMedian)
    matched = ready && item.ma20Slope! > 0 && item.ma60Slope! > 0 && item.volatility20! < context.sampleVolatilityMedian! && item.riskLevel !== 'high' && item.rsi14! < 70
    rules.push('MA20 / MA60 向上', '波動率低於樣本中位數', 'ATR 風險非高', 'RSI 未過熱')
  } else if (id === 'high-volume-momentum') {
    const ready = ['volumeRatio', 'return20', 'aboveMa20'].every((field) => need(field as keyof typeof item))
    matched = ready && item.volumeRatio! >= 2 && item.return20! > 0 && item.aboveMa20 === true
    rules.push('量比 ≥ 2', '20 日報酬 > 0', '收盤 > MA20')
  } else if (id === 'defensive-watch') {
    const ready = ['volatility20', 'aboveMa60', 'rsi14'].every((field) => need(field as keyof typeof item)) && present(context.sampleVolatilityMedian)
    matched = ready && item.volatility20! <= context.sampleVolatilityMedian! && item.aboveMa60 === true && item.rsi14! >= 45 && item.rsi14! <= 65 && item.riskLevel !== 'high'
    rules.push('波動率低於樣本中位數', 'close > MA60', 'RSI 45–65', '無高風險訊號')
  } else if (id === 'high-risk-warning') {
    const overbought = item.rsi14 !== null && item.rsi14 >= 75
    const highAtr = item.atr14 !== null && item.close !== null && item.close > 0 && item.atr14 / item.close >= 0.04
    const brokenAverage = item.aboveMa20 === false || item.aboveMa60 === false
    const largeMove = item.changePercent !== null && Math.abs(item.changePercent) >= 7
    const institutionSell = context.institutionalNet !== null && context.institutionalNet < 0
    matched = overbought || highAtr || brokenAverage || largeMove || institutionSell || item.riskLevel === 'high'
    rules.push('RSI 過熱', 'ATR 偏高', '跌破 MA20 / MA60', '單日大幅波動', '法人明顯賣超')
  } else {
    matched = item.historyRecordCount >= 250 && item.technicalScore !== null && context.decisionScore !== null && ['aligned', 'acceptable'].includes(context.dateAlignment.status) && item.status !== 'stale'
    if (item.technicalScore === null) missing.push('technicalScore')
    if (context.decisionScore === null) missing.push('decisionScore')
    rules.push('歷史資料 ≥ 250 日', '技術指標完整', '行情 / 法人 / Snapshot 日期一致', '無 stale', 'Technical / Decision 可用')
  }
  return { matched, rules, missing: [...new Set(missing)] }
}

export function evaluateScreenerPreset(presetId: ScreenerPresetId, context: ScreenerEvaluationContext): ScreenerResult {
  const evaluation = evaluatePreset(presetId, context)
  const explanation = explainTechnicalContext(context)
  const item = context.technical
  const confidence = Math.max(0, Math.min(100, item.technicalConfidence - context.dateAlignment.confidencePenalty - evaluation.missing.length * 5))
  return {
    symbol: item.symbol, name: item.name, tradeDate: item.tradeDate, presetId, matched: evaluation.matched, rank: 0,
    score: item.technicalScore, confidence, technicalScore: item.technicalScore, decisionScore: context.decisionScore,
    healthScore: context.healthScore, snapshotScore: context.snapshotScore, close: item.close, changePercent: item.changePercent,
    rsi14: item.rsi14, macdHistogram: item.macdHistogram, volumeRatio: item.volumeRatio, aboveMa20: item.aboveMa20, aboveMa60: item.aboveMa60,
    k: item.k, d: item.d, return20: item.return20, return60: item.return60, volatility20: item.volatility20,
    historyRecordCount: item.historyRecordCount, stale: item.status === 'stale', dateAlignmentStatus: context.dateAlignment.status,
    institutionalNet: context.institutionalNet, riskLevel: item.riskLevel,
    reasons: explanation.reasons, risks: explanation.risks, matchedRules: evaluation.rules, missingFields: evaluation.missing,
    sourceSummary: ['TWSE Official History', context.institutionalNet === null ? 'Institutional Missing' : 'TWSE Official Institutional', context.decisionScore === null ? 'Decision Missing' : 'Decision Repository'],
    warnings: item.warnings,
  }
}
