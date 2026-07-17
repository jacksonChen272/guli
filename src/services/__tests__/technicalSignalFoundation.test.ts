import { describe, expect, it } from 'vitest'
import { calculateTechnicalIndicators } from '../technical/TechnicalIndicatorService'
import { generateTechnicalSignals } from '../technical/TechnicalSignalService'
import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'

const prices: OfficialStockHistoryPrice[] = Array.from({ length: 80 }, (_, index) => ({ tradeDate: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10), open: 100 + index, high: 103 + index, low: 98 + index, close: 101 + index, change: 1, volume: 1_000 + index, tradingAmount: 100_000, transactionCount: 100 }))

describe('technical signals use deterministic evidence', () => {
  it('returns no signal for empty history', () => { expect(generateTechnicalSignals(calculateTechnicalIndicators([]))).toEqual([]) })
  it('always includes an RSI state when RSI is available', () => { expect(generateTechnicalSignals(calculateTechnicalIndicators(prices)).some((signal) => signal.id.startsWith('rsi-'))).toBe(true) })
  it('labels overheated RSI as warning', () => { const signal = generateTechnicalSignals(calculateTechnicalIndicators(prices)).find((item) => item.name === 'RSI 過熱'); expect(signal?.direction).toBe('warning'); expect(signal?.evidence.rsi).toBe(100) })
  it('detects close crossing above MA20', () => { const series = calculateTechnicalIndicators(prices); const index = series.prices.length - 1; series.prices[index - 1] = { ...series.prices[index - 1], close: 90 }; series.ma20[index - 1] = { ...series.ma20[index - 1], value: 100 }; series.prices[index] = { ...series.prices[index], close: 110 }; series.ma20[index] = { ...series.ma20[index], value: 101 }; expect(generateTechnicalSignals(series).some((signal) => signal.id === 'close-cross-ma20-up')).toBe(true) })
  it('detects MA5 death cross', () => { const series = calculateTechnicalIndicators(prices); const index = series.prices.length - 1; series.ma5[index - 1] = { ...series.ma5[index - 1], value: 105 }; series.ma20[index - 1] = { ...series.ma20[index - 1], value: 100 }; series.ma5[index] = { ...series.ma5[index], value: 99 }; series.ma20[index] = { ...series.ma20[index], value: 101 }; expect(generateTechnicalSignals(series).some((signal) => signal.id === 'ma5-cross-ma20-down')).toBe(true) })
  it('detects MACD golden cross', () => { const series = calculateTechnicalIndicators(prices); const index = series.prices.length - 1; series.macd[index - 1] = { ...series.macd[index - 1], macd: -1, signal: 0 }; series.macd[index] = { ...series.macd[index], macd: 1, signal: 0 }; expect(generateTechnicalSignals(series).some((signal) => signal.id === 'macd-golden-cross')).toBe(true) })
  it('detects volume above 1.5x average', () => { const series = calculateTechnicalIndicators(prices); series.volumeRatio20[series.volumeRatio20.length - 1] = { ...series.volumeRatio20.at(-1)!, value: 1.6 }; expect(generateTechnicalSignals(series).some((signal) => signal.id === 'volume-expansion')).toBe(true) })
  it('does not emit false crossing signals when values are null', () => { const series = calculateTechnicalIndicators(prices.slice(0, 5)); expect(generateTechnicalSignals(series).some((signal) => signal.id.includes('cross'))).toBe(false) })
  it('keeps source and formula version on every signal', () => { const signals = generateTechnicalSignals(calculateTechnicalIndicators(prices)); expect(signals.every((signal) => signal.source.includes('TWSE') && signal.formulaVersion === 'technical-signal-v1.0')).toBe(true) })
})

