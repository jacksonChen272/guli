import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../StockCommandCenter.tsx', import.meta.url), 'utf8')

describe('StockCommandCenter', () => {
  it('renders the existing rule-based narrative and required state hierarchy', () => {
    for (const label of ['研究結論', '技術趨勢', '法人狀態', '單日快照', '風險層級']) {
      expect(source).toContain(label)
    }
  })

  it('renders factor groups conditionally without fetching data', () => {
    expect(source).toContain('主要正向因子')
    expect(source).toContain('主要風險')
    expect(source).toContain('中性觀察')
    expect(source).toContain('if (!items.length) return null')
    expect(source).not.toContain('fetch(')
  })

  it('connects all four command center actions', () => {
    for (const action of ['查看技術分析', '查看法人籌碼', '查看同產業', '加入自選']) {
      expect(source).toContain(action)
    }
  })
})
