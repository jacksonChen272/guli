import { describe, expect, it } from 'vitest'
import { mergeHistoryPoints } from '../../../../scripts/data/history/HistoryValidator.ts'

const row = (tradeDate: string, close: number) => ({ tradeDate, open: close, high: close, low: close, close, change: 0, volume: 1, tradingAmount: 1, transactionCount: 1 })
describe('Incremental History Update', () => {
  it('keeps oldest-to-newest order after merge', () => expect(mergeHistoryPoints([row('2026-07-15', 10)], [row('2026-07-17', 12), row('2026-07-16', 11)]).map((item) => item.tradeDate)).toEqual(['2026-07-15', '2026-07-16', '2026-07-17']))
  it('does not create a duplicate latest day', () => expect(mergeHistoryPoints([row('2026-07-16', 10)], [row('2026-07-16', 11)])).toHaveLength(1))
})
