import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const hook = readFileSync(new URL('../../../hooks/useStockAnalysisData.ts', import.meta.url), 'utf8')
const historyRepository = readFileSync(new URL('../../../repositories/StockHistoryRepository.ts', import.meta.url), 'utf8')

describe('Stock Page history request boundary', () => {
  it('requests history only for the active symbol', () => {
    expect(hook).toContain('getHistory(normalizedSymbol)')
    expect(hook).not.toContain('getAllHistory')
    expect(hook).not.toContain('Promise.all(universe')
  })

  it('keeps the existing per-symbol repository cache', () => {
    expect(historyRepository).toContain('stock-history:${symbol}')
  })
})
