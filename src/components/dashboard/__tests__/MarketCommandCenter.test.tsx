import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../MarketCommandCenter.tsx', import.meta.url), 'utf8')

describe('MarketCommandCenter', () => {
  it('renders official index, turnover, institutions, and sentiment inputs', () => {
    expect(source).toContain('market?.indexValue')
    expect(source).toContain('market?.tradingAmount')
    expect(source).toContain('institutions?.foreign.netAmount')
    expect(source).toContain('<MarketSentimentVisual')
  })

  it('uses a score view model rather than mixing score meanings in JSX', () => {
    expect(source).toContain('buildMarketScoreViewModel')
    expect(source).toContain('趨勢方向：')
    expect(source).toContain('市場廣度：')
    expect(source).toContain('市場情緒使用')
  })

  it('shows an explicit empty state and never creates fake data', () => {
    expect(source).toContain('目前沒有市場總覽資料')
    expect(source).toContain('尚未取得')
    expect(source).not.toContain('Math.random')
  })
})
