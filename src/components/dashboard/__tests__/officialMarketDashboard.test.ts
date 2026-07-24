import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const dashboard = source('../../../pages/Dashboard.tsx')
const commandCenter = source('../MarketCommandCenter.tsx')
const hook = source('../../../hooks/useTodayDashboardData.ts')
const ranking = source('../MarketRanking.tsx')
const providerFactory = source('../../../providers/ProviderFactory.ts')

describe('Today Dashboard official market wiring', () => {
  it('defaults market data to TWSE Provider', () => expect(providerFactory).toContain("private activeId: ProviderId = 'twse'"))
  it('presents official market data through Market Command Center', () => { expect(dashboard).toContain('<MarketCommandCenter'); expect(commandCenter).toContain('market?.indexValue'); expect(commandCenter).toContain('market?.tradingAmount') })
  it('loads institutions through InstitutionRepository', () => { expect(hook).toContain('repositoryHub.institutions.getMarketTotals()'); expect(hook).not.toContain('fetch(') })
  it('keeps all four TWSE ranking tabs', () => { for (const key of ['tradingAmount', 'tradingVolume', 'gainers', 'losers']) expect(ranking).toContain(key); expect(ranking).not.toContain('fetch(') })
  it('does not use legacy institutional mock fields', () => { expect(dashboard).not.toContain('institutionalFlows.foreign'); expect(dashboard).not.toContain("source: 'mock'") })
})
