import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const dashboard = source('../../../pages/Dashboard.tsx')
const ranking = source('../MarketRanking.tsx')
const breadth = source('../MarketBreadth.tsx')
const providerFactory = source('../../../providers/ProviderFactory.ts')

describe('Dashboard TWSE official wiring', () => {
  it('預設資料來源為 TWSE Provider', () => expect(providerFactory).toContain("private activeId: ProviderId = 'twse'"))
  it('市場統計卡不再掛載櫃買或法人 Mock 卡', () => {
    expect(dashboard).not.toContain('indices[1]')
    expect(dashboard).not.toContain('institutionalFlows.foreign')
    expect(dashboard).not.toContain("source: 'mock'")
  })
  it('Dashboard 顯示 TWSE 成交值與成交量', () => {
    expect(dashboard).toContain("name: '上市成交值'")
    expect(dashboard).toContain("name: '上市成交量'")
    expect(dashboard).toContain('toHundredMillionShares')
  })
  it('市場廣度包含漲跌平盤與漲跌停五項', () => {
    for (const label of ['上漲家數', '下跌家數', '平盤家數', '漲停家數', '跌停家數']) expect(breadth).toContain(label)
  })
  it('四組官方排行由 Repository 資料傳入且元件不直接 fetch', () => {
    for (const key of ['tradingAmount', 'tradingVolume', 'gainers', 'losers']) expect(ranking).toContain(key)
    expect(dashboard).toContain('<MarketRanking data={officialMarket} />')
    expect(ranking).not.toContain('fetch(')
    expect(ranking).not.toContain('twse-market-overview.json')
  })
})
