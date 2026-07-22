import { describe, expect, it } from 'vitest'
import { resolvePlannedSymbols, selectPendingHistoryBatch } from '../../../../scripts/data/history/HistoryAutomation.ts'
import type { HistoryManifestItem, HistoryProgress } from '../../../../scripts/data/history/types.ts'

const item = (symbol: string, status: HistoryManifestItem['status'], overrides: Partial<HistoryManifestItem> = {}): HistoryManifestItem => ({
  symbol,
  name: symbol,
  status,
  recordCount: 0,
  firstDate: null,
  lastDate: null,
  lastUpdatedAt: null,
  source: 'TWSE',
  isOfficial: false,
  validationStatus: status === 'pending' ? 'pending' : status === 'unsupported' ? 'unsupported' : 'valid',
  errors: [],
  securityType: 'common_stock',
  eligibleForTechnical: true,
  technicalDataReady: false,
  path: null,
  ...overrides,
})

describe('daily 100 history selection', () => {
  it('selects at most 100 pending eligible common stocks in symbol order', () => {
    const rows = Array.from({ length: 130 }, (_, index) => item(String(1299 - index).padStart(4, '0'), 'pending'))
    const selected = selectPendingHistoryBatch(rows)
    expect(selected).toHaveLength(100)
    expect(selected.map((row) => row.symbol)).toEqual([...selected].map((row) => row.symbol).sort())
  })

  it('excludes complete, partial, failed, unsupported and non-common instruments', () => {
    const selected = selectPendingHistoryBatch([
      item('1101', 'complete'), item('1102', 'partial'), item('1103', 'failed'), item('1104', 'unsupported'),
      item('1105', 'pending', { securityType: 'etf' }), item('1106', 'pending', { eligibleForTechnical: false }), item('1107', 'pending'),
    ])
    expect(selected.map((row) => row.symbol)).toEqual(['1107'])
  })

  it('returns an empty plan without making a synthetic candidate when pending is zero', () => {
    expect(selectPendingHistoryBatch([item('2330', 'complete')])).toEqual([])
  })
})

describe('planned symbol checkpoint', () => {
  it('reuses the same locked symbols after an interruption', () => {
    const progress = { phase: 'daily-100-7', status: 'running', plannedSymbols: ['1101', '1102'] } as HistoryProgress
    expect(resolvePlannedSymbols(progress, 'daily-100-7', ['1201', '1202'])).toEqual(['1101', '1102'])
  })

  it('creates a new plan for a different phase', () => {
    const progress = { phase: 'old', status: 'running', plannedSymbols: ['1101'] } as HistoryProgress
    expect(resolvePlannedSymbols(progress, 'new', ['1201'])).toEqual(['1201'])
  })
})
