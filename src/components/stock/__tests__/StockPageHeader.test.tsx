import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../StockPageHeader.tsx', import.meta.url), 'utf8')

describe('StockPageHeader', () => {
  it('shows official quote identity and complete primary metrics', () => {
    for (const label of ['TWSE Official', '成交量', '成交值', '本益比', '資料日']) {
      expect(source).toContain(label)
    }
  })

  it('keeps watchlist, alert, comparison, sharing, and export actions', () => {
    for (const action of ['加入自選', '建立提醒', '同業比較', '分享', '匯出分析']) {
      expect(source).toContain(action)
    }
  })

  it('communicates price direction with text and icon', () => {
    expect(source).toContain("'上漲'")
    expect(source).toContain("'下跌'")
    expect(source).toContain('▲')
    expect(source).toContain('▼')
  })

  it('uses two-column touch actions without horizontal overflow', () => {
    expect(source).toContain('grid-cols-2')
    expect(source).toContain('w-full sm:w-auto')
  })
})
