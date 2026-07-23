import { describe, expect, it } from 'vitest'
import { calculateTechnicalIndicators } from '../../technical/TechnicalIndicatorService'
import type { OfficialStockHistoryPrice } from '../../../types/officialStockHistory'
import { detectPricePivots } from '../PivotDetectionService'
import { buildPriceZones } from '../PriceZoneService'
import { calculateSupportResistanceFromHistory } from '../SupportResistanceService'
import { classifyTrendStructure } from '../TrendStructureService'

const prices = (count: number, start = 100, step = .4): OfficialStockHistoryPrice[] => Array.from({ length: count }, (_, index) => { const close = start + index * step; return { tradeDate: `2025-${String(Math.floor(index / 28) + 1).padStart(2, '0')}-${String(index % 28 + 1).padStart(2, '0')}`, open: close - .5, high: close + 1, low: close - 1, close, change: step, volume: 1_000_000 + index * 1000, tradingAmount: close * 1_000_000, transactionCount: 1000 } })

describe('support-resistance-v1.0', () => {
  it('does not fabricate zones with fewer than 20 records', () => expect(calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(19))).zones).toEqual([]))
  it('reports an insufficient-history warning', () => expect(calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(19))).warnings[0]).toContain('20'))
  it('keeps the formula version stable', () => expect(calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(80))).formulaVersion).toBe('support-resistance-v1.0'))
  it('keeps support centers at or below current price', () => { const result = calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(80))); expect(result.supports.every((zone) => zone.center <= result.currentPrice!)).toBe(true) })
  it('keeps resistance centers at or above current price', () => { const result = calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(80))); expect(result.resistances.every((zone) => zone.center >= result.currentPrice!)).toBe(true) })
  it('includes 20-day range evidence', () => expect(calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(80))).zones.flatMap((zone) => zone.sources).some((source) => source.includes('20 日'))).toBe(true))
  it('includes 60-day range evidence when available', () => expect(calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(80))).zones.flatMap((zone) => zone.sources).some((source) => source.includes('60 日'))).toBe(true))
  it('warns when 60-day evidence is unavailable', () => expect(calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(40))).warnings.some((warning) => warning.includes('60'))).toBe(true))
  it('uses ATR to define zone width', () => { const result = calculateSupportResistanceFromHistory(calculateTechnicalIndicators(prices(80))); expect(result.zones.every((zone) => zone.upper > zone.lower)).toBe(true) })
  it('returns pivots with their dates', () => { const rows = prices(9, 100, 0); rows[4] = { ...rows[4], high: 120 }; expect(detectPricePivots(rows, 2)).toContainEqual(expect.objectContaining({ type: 'high', price: 120, tradeDate: rows[4].tradeDate })) })
  it('detects local lows', () => { const rows = prices(9, 100, 0); rows[4] = { ...rows[4], low: 80 }; expect(detectPricePivots(rows, 2)).toContainEqual(expect.objectContaining({ type: 'low', price: 80 })) })
  it('does not inspect incomplete pivot windows', () => expect(detectPricePivots(prices(4), 2)).toEqual([]))
  it('merges nearby candidates', () => expect(buildPriceZones([{ price: 99, type: 'support', source: 'A' }, { price: 99.2, type: 'support', source: 'B' }], prices(30, 100, 0), 100, 2)).toHaveLength(1))
  it('preserves merged sources', () => expect(buildPriceZones([{ price: 99, type: 'support', source: 'A' }, { price: 99.2, type: 'support', source: 'B' }], prices(30, 100, 0), 100, 2)[0].sources).toEqual(['A', 'B']))
  it('classifies repeated zones as strong', () => expect(buildPriceZones([{ price: 100, type: 'support', source: 'A' }], prices(30, 100, 0), 101, 1)[0].strength).toBe('strong'))
  it('calculates signed distance percent', () => expect(buildPriceZones([{ price: 90, type: 'support', source: 'A' }], [], 100, 1)[0].distancePercent).toBe(-10))
  it('classifies an orderly rising series as bullish', () => expect(['多頭排列', '偏多結構']).toContain(classifyTrendStructure(calculateTechnicalIndicators(prices(140, 50, 1))).classification))
  it('classifies an orderly falling series as bearish', () => expect(['空頭排列', '偏空結構']).toContain(classifyTrendStructure(calculateTechnicalIndicators(prices(140, 250, -1))).classification))
  it('returns insufficient trend with fewer than 60 days', () => expect(classifyTrendStructure(calculateTechnicalIndicators(prices(40))).classification).toBe('資料不足'))
  it('does not claim ADX evidence', () => expect(JSON.stringify(classifyTrendStructure(calculateTechnicalIndicators(prices(80))))).not.toMatch(/ADX/i))
})
