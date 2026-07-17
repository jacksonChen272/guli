import { describe, expect, it } from 'vitest'
import { calculateATR } from '../technical/ATRService'
import { calculateBollinger } from '../technical/BollingerService'
import { calculateEMA } from '../technical/EMAService'
import { calculateMACD } from '../technical/MACDService'
import { calculateRSI } from '../technical/RSIService'
import { calculateSMA } from '../technical/SMAService'
import { calculateStochastic } from '../technical/StochasticService'
import { calculateTechnicalIndicators, createTechnicalSummary } from '../technical/TechnicalIndicatorService'
import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'

const prices = (count: number, direction = 1, volumeMultiplier = 1): OfficialStockHistoryPrice[] => Array.from({ length: count }, (_, index) => {
  const close = 100 + direction * index
  return { tradeDate: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10), open: close - direction * 0.5, high: close + 2, low: close - 2, close, change: direction, volume: Math.round((1_000 + index * 10) * volumeMultiplier), tradingAmount: close * 1_000, transactionCount: 100 + index }
})

describe('technical indicator fixed formulas', () => {
  it('MA5 is null before five periods', () => { expect(calculateSMA(prices(4), 5).every((point) => point.value === null)).toBe(true) })
  it('MA5 uses the arithmetic mean', () => { expect(calculateSMA(prices(5), 5).at(-1)?.value).toBe(102) })
  it('EMA seeds from SMA', () => { expect(calculateEMA(prices(12), 12).at(-1)?.value).toBe(105.5) })
  it('RSI14 is null with fourteen records', () => { expect(calculateRSI(prices(14)).at(-1)?.value).toBeNull() })
  it('RSI reaches 100 for continuous gains', () => { expect(calculateRSI(prices(20)).at(-1)?.value).toBe(100) })
  it('RSI reaches 0 for continuous losses', () => { expect(calculateRSI(prices(20, -1)).at(-1)?.value).toBe(0) })
  it('KD is null before nine records', () => { expect(calculateStochastic(prices(8)).at(-1)?.k).toBeNull() })
  it('KD produces bounded K and D', () => { const value = calculateStochastic(prices(20)).at(-1); expect(value?.k).toBeGreaterThanOrEqual(0); expect(value?.k).toBeLessThanOrEqual(100); expect(value?.d).toBeGreaterThanOrEqual(0); expect(value?.d).toBeLessThanOrEqual(100) })
  it('MACD is unavailable before slow EMA and signal seed', () => { expect(calculateMACD(prices(30)).at(-1)?.signal).toBeNull() })
  it('MACD is positive in a rising series', () => { expect(calculateMACD(prices(60)).at(-1)?.macd).toBeGreaterThan(0) })
  it('Bollinger is null before twenty records', () => { expect(calculateBollinger(prices(19)).at(-1)?.middle).toBeNull() })
  it('Bollinger middle equals MA20', () => { const data = prices(20); expect(calculateBollinger(data).at(-1)?.middle).toBe(calculateSMA(data, 20).at(-1)?.value) })
  it('Bollinger upper is above lower', () => { const value = calculateBollinger(prices(20)).at(-1); expect(value?.upper).toBeGreaterThan(value?.lower as number) })
  it('ATR is null before fourteen records', () => { expect(calculateATR(prices(13)).at(-1)?.value).toBeNull() })
  it('ATR is positive with valid OHLC', () => { expect(calculateATR(prices(20)).at(-1)?.value).toBeGreaterThan(0) })
  it('calculates all requested moving averages', () => { const result = calculateTechnicalIndicators(prices(130)); expect(result.ma5.at(-1)?.value).not.toBeNull(); expect(result.ma10.at(-1)?.value).not.toBeNull(); expect(result.ma20.at(-1)?.value).not.toBeNull(); expect(result.ma60.at(-1)?.value).not.toBeNull(); expect(result.ma120.at(-1)?.value).not.toBeNull() })
  it('MA120 stays null with 119 records', () => { expect(calculateTechnicalIndicators(prices(119)).ma120.at(-1)?.value).toBeNull() })
  it('60-day return stays null before 61 records', () => { expect(calculateTechnicalIndicators(prices(60)).return60.at(-1)?.value).toBeNull() })
  it('20-day return follows price ratio', () => { expect(calculateTechnicalIndicators(prices(30)).return20.at(-1)?.value).toBeCloseTo((129 / 109 - 1) * 100, 3) })
  it('volume ratio is current volume divided by 20-day average', () => { const result = calculateTechnicalIndicators(prices(30)); const expected = (1_290 / ((1_100 + 1_290) / 2)); expect(result.volumeRatio20.at(-1)?.value).toBeCloseTo(expected, 3) })
  it('volatility is null before 21 records', () => { expect(calculateTechnicalIndicators(prices(20)).volatility20.at(-1)?.value).toBeNull() })
  it('summary keeps six fixed categories', () => { expect(createTechnicalSummary(calculateTechnicalIndicators(prices(130))).map((item) => item.id)).toEqual(['trend', 'rsi', 'kd', 'macd', 'volume', 'volatility']) })
  it('summary exposes period and source date', () => { const summary = createTechnicalSummary(calculateTechnicalIndicators(prices(130))); expect(summary.every((item) => item.period && item.tradeDate && item.source === 'Derived')).toBe(true) })
  it('null close propagates instead of becoming zero', () => { const data = prices(25); data[24].close = null; const result = calculateTechnicalIndicators(data); expect(result.ma20.at(-1)?.value).toBeNull(); expect(result.return20.at(-1)?.value).toBeNull() })
})

