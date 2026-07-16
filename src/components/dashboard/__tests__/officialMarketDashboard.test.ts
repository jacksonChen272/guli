import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const dashboard = source('../../../pages/Dashboard.tsx'); const ranking = source('../MarketRanking.tsx'); const breadth = source('../MarketBreadth.tsx'); const providerFactory = source('../../../providers/ProviderFactory.ts'); const institutions = source('../InstitutionalOverview.tsx')
describe('Dashboard TWSE official wiring', () => {
  it('預設資料來源為 TWSE Provider', () => expect(providerFactory).toContain("private activeId: ProviderId = 'twse'"))
  it('市場統計卡不再掛載櫃買或法人 Mock 卡', () => { expect(dashboard).not.toContain('indices[1]'); expect(dashboard).not.toContain('institutionalFlows.foreign'); expect(dashboard).not.toContain("source: 'mock'") })
  it('Dashboard 顯示 TWSE 成交值與成交量', () => { expect(dashboard).toContain('toHundredMillionShares'); expect(dashboard).toContain('<MarketBreadth data={officialMarket} />') })
  it('近似漲跌停已改名並明示衍生統計', () => { for (const label of ['上漲家數', '下跌家數', '平盤家數', '漲幅 ≥ 9.5%', '跌幅 ≤ -9.5%', '衍生統計', '不是證交所官方漲停／跌停家數']) expect(breadth).toContain(label) })
  it('四組官方排行由資料傳入且元件不直接 fetch', () => { for (const key of ['tradingAmount', 'tradingVolume', 'gainers', 'losers']) expect(ranking).toContain(key); expect(ranking).not.toContain('fetch(') })
  it('官方法人卡與排行透過 Repository', () => { expect(dashboard).toContain('<InstitutionalOverview />'); expect(institutions).toContain('repositoryHub.institutions'); expect(institutions).toContain('TWSE Official'); expect(institutions).not.toContain('fetch(') })
})
