import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const dashboard = source('../../../pages/Dashboard.tsx')
const hero = source('../TodayMarketHero.tsx')
const hook = source('../../../hooks/useTodayDashboardData.ts')
const ranking = source('../MarketRanking.tsx')
const providerFactory = source('../../../providers/ProviderFactory.ts')

describe('Today Dashboard official market wiring', () => {
  it('市場資料預設使用 TWSE Provider', () => expect(providerFactory).toContain("private activeId: ProviderId = 'twse'"))
  it('首頁以 Today Market Hero 呈現官方市場資料', () => { expect(dashboard).toContain('<TodayMarketHero'); expect(hero).toContain('market?.indexValue'); expect(hero).toContain('market?.tradingAmount') })
  it('首頁外資資料經 InstitutionRepository 取得', () => { expect(hook).toContain('repositoryHub.institutions.getMarketTotals()'); expect(hook).not.toContain('fetch(') })
  it('首頁保留證交所四種排行榜 Tab', () => { for (const key of ['tradingAmount', 'tradingVolume', 'gainers', 'losers']) expect(ranking).toContain(key); expect(ranking).not.toContain('fetch(') })
  it('首頁不使用舊法人 Mock 欄位', () => { expect(dashboard).not.toContain('institutionalFlows.foreign'); expect(dashboard).not.toContain("source: 'mock'") })
})
