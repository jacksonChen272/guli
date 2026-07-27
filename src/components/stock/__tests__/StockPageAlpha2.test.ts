import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { DecisionFactor } from '../../../types/decision'
import type { SupportResistanceAnalysis } from '../../../types/supportResistance'
import {
  getAvailableHistoryRanges,
  getDefaultHistoryRange,
} from '../../charts/lightweight/ChartToolbar'
import { groupDecisionFactors } from '../StockDecisionExplanation'
import { buildPricePositionModel } from '../StockKeyLevelsCard'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')
const header = read('src/components/stock/StockPageHeader.tsx')
const command = read('src/components/stock/StockCommandCenter.tsx')
const scores = read('src/components/stock/StockCoreScoreStrip.tsx')
const status = read('src/components/stock/StockDataStatusBar.tsx')
const boundary = read('src/components/stock/StockSectionErrorBoundary.tsx')
const toolbar = read('src/components/charts/lightweight/ChartToolbar.tsx')
const chart = read('src/components/charts/lightweight/CandlestickPriceChart.tsx')
const page = read('src/pages/StockDetailWithSnapshot.tsx')

const positionAnalysis = (
  current: number | null,
  support = 90,
  resistance = 110,
) => ({
  currentPrice: current,
  supports: [{ center: support, distancePercent: -10 }],
  resistances: [{ center: resistance, distancePercent: 10 }],
} as unknown as SupportResistanceAnalysis)

const factor = (
  code: string,
  direction: DecisionFactor['direction'],
  contribution: number | null,
  sourceType: DecisionFactor['sourceType'] = 'derived',
): DecisionFactor => ({
  code,
  name: code,
  rawValue: contribution,
  normalizedScore: contribution,
  weight: 0.2,
  contribution,
  direction,
  explanation: code,
  evidence: [{ label: code, value: contribution, source: 'existing', tradeDate: '2026-07-24' }],
  sourceType,
})

describe('Stock Page 3.0 alpha.2 polish', () => {
  it('keeps long names and values inside flexible header columns', () => {
    expect(header).toContain('min-w-0')
    expect(header).toContain('break-words')
  })

  it('adds contextual badges through the existing view model', () => {
    expect(header).toContain('buildStockHeaderBadges')
    expect(header).toContain('contextBadges.map')
  })

  it('keeps command conclusion concise at mobile widths', () => {
    expect(command).toContain('line-clamp-3')
    expect(command).toContain('sm:line-clamp-2')
  })

  it('connects command CTA to real callbacks', () => {
    for (const callback of ['onViewTechnical', 'onViewInstitutional', 'onViewIndustry', 'onToggleWatchlist']) {
      expect(command).toContain(callback)
      expect(page).toContain(callback)
    }
  })

  it('does not render a blank factor frame', () => {
    expect(command).toContain('if (!items.length) return null')
  })

  it('does not render risk as a percentage meter', () => {
    expect(scores).toContain("score.id !== 'risk'")
    expect(scores).toContain('類別量尺')
  })

  it('does not turn missing numeric scores into zero', () => {
    expect(scores).toContain('score.value !== null')
    expect(scores).not.toContain('score.value || 0')
  })

  it('labels the score meter for assistive technology', () => {
    expect(scores).toContain('aria-valuenow')
    expect(scores).toContain('aria-valuemin={0}')
    expect(scores).toContain('aria-valuemax={100}')
  })

  it('calculates a midpoint position without changing support values', () => {
    const result = buildPricePositionModel(positionAnalysis(100))
    expect(result).toMatchObject({ support: 90, current: 100, resistance: 110, positionPercent: 50 })
  })

  it('clamps a breakout marker at the upper edge', () => {
    const result = buildPricePositionModel(positionAnalysis(120))
    expect(result?.positionPercent).toBe(100)
    expect(result?.label).toContain('突破壓力')
  })

  it('clamps a support breakdown marker at the lower edge', () => {
    const result = buildPricePositionModel(positionAnalysis(80))
    expect(result?.positionPercent).toBe(0)
    expect(result?.label).toContain('跌破支撐')
  })

  it('does not show a misleading position for an invalid interval', () => {
    expect(buildPricePositionModel(positionAnalysis(100, 110, 90))).toBeNull()
  })

  it('does not show a position when current price is missing', () => {
    expect(buildPricePositionModel(positionAnalysis(null))).toBeNull()
  })

  it('enables only ranges backed by available records', () => {
    expect(getAvailableHistoryRanges(40)).toEqual(['1M', 'ALL'])
    expect(getAvailableHistoryRanges(120)).toEqual(['1M', '3M', 'ALL'])
  })

  it('chooses the largest useful default history range', () => {
    expect(getDefaultHistoryRange(300)).toBe('1Y')
    expect(getDefaultHistoryRange(140)).toBe('6M')
    expect(getDefaultHistoryRange(10)).toBe('ALL')
  })

  it('treats invalid record counts as all-history only', () => {
    expect(getAvailableHistoryRanges(Number.NaN)).toEqual(['ALL'])
  })

  it('renders insufficient history ranges as disabled controls', () => {
    expect(toolbar).toContain('disabled={!enabled}')
    expect(toolbar).toContain('至少需要')
    expect(toolbar).toContain('cursor-not-allowed')
  })

  it('keeps the chart tooltip inside its mobile container', () => {
    expect(chart).toContain('max-w-[min(320px,calc(100%-24px))]')
    expect(chart).toContain('[overflow-wrap:anywhere]')
    expect(chart).toContain('left-3 top-3')
  })

  it('deduplicates decision factors by code', () => {
    const groups = groupDecisionFactors([
      factor('trend', 'positive', 8),
      factor('trend', 'positive', 8),
    ])
    expect(groups.positive).toHaveLength(1)
  })

  it('classifies each available decision factor once', () => {
    const groups = groupDecisionFactors([
      factor('positive', 'positive', 8),
      factor('neutral', 'neutral', 0),
      factor('negative', 'negative', -3),
    ])
    expect(groups.positive.map((item) => item.code)).toEqual(['positive'])
    expect(groups.neutral.map((item) => item.code)).toEqual(['neutral'])
    expect(groups.negative.map((item) => item.code)).toEqual(['negative'])
  })

  it('separates missing decision inputs from neutral factors', () => {
    const groups = groupDecisionFactors([
      factor('missing', 'unknown', null, 'missing'),
      factor('neutral', 'neutral', 0),
    ])
    expect(groups.missing.map((item) => item.code)).toEqual(['missing'])
    expect(groups.neutral.map((item) => item.code)).toEqual(['neutral'])
  })

  it('exposes data status expansion state and warning count', () => {
    expect(status).toContain('aria-expanded={open}')
    expect(status).toContain('alertCount')
    expect(status).toContain('資料提醒')
  })

  it('limits section retry attempts and resets on symbol change', () => {
    expect(boundary).toContain('MAX_RETRY_ATTEMPTS = 3')
    expect(boundary).toContain('previousProps.resetKey !== this.props.resetKey')
  })

  it('keeps every section independently recoverable', () => {
    expect(page.match(/resetKey=\{symbol\}/g)?.length ?? 0).toBeGreaterThanOrEqual(10)
  })

  it('uses one consolidated warning surface', () => {
    expect(page).not.toContain('StockAnalysisDataGuard')
    expect(page).toContain('messages={[...data.errors, ...data.warnings]}')
  })

  it('does not fetch or access repositories from the page components', () => {
    for (const source of [header, command, scores, status, page]) {
      expect(source).not.toContain('fetch(')
      expect(source).not.toContain('RepositoryHub')
      expect(source).not.toContain('repositoryHub')
    }
  })

  it('keeps 375px overflow and Safari safe area guards', () => {
    expect(page).toContain('overflow-x-clip')
    expect(page).toContain('env(safe-area-inset-bottom)')
  })

  it('preserves reduced-motion behavior for interactive polish', () => {
    expect(command).toContain('motion-reduce:')
    expect(scores).toContain('motion-reduce:')
    expect(status).toContain('motion-reduce:')
  })
})
