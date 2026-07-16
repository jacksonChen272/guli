import type { IndustryRepository } from '../../repositories/IndustryRepository'
import type { InstitutionRepository } from '../../repositories/InstitutionRepository'
import type { StockRepository } from '../../repositories/StockRepository'
import type { Industry } from '../../types/industry'
import type { IndustrySnapshot, IndustrySnapshotItem, IndustryStatus } from '../../types/industrySnapshot'
import type { Stock } from '../../types/stock'
import { calculateStockHealth } from '../stockHealthService'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
const returnFor = (stock: Stock, days: number) => { const points = stock.priceHistory.slice(-(days + 1)); return points.length > 1 ? (points.at(-1)!.value / points[0].value - 1) * 100 : null }
export const statusForIndustryScore = (score: number): IndustryStatus => score >= 81 ? '強勢' : score >= 66 ? '偏強' : score >= 51 ? '中性' : score >= 36 ? '偏弱' : '弱勢'

export interface IndustrySnapshotGeneratorInput {
  tradeDate: string
  generatedAt?: string
  industries: Industry[]
  stocks: Stock[]
  previous?: IndustrySnapshot | null
  marketReturn?: number
}

export class IndustrySnapshotGenerator {
  constructor(private readonly industryRepository?: IndustryRepository, private readonly stockRepository?: StockRepository, private readonly institutionRepository?: InstitutionRepository) {}

  generate(input: IndustrySnapshotGeneratorInput): IndustrySnapshot {
    const warnings: string[] = []
    const marketReturn = input.marketReturn ?? average(input.stocks.map((stock) => stock.changePercent))
    const items = input.industries.map((industry) => this.buildItem(industry, input.stocks, marketReturn, warnings))
      .sort((a, b) => b.strengthScore - a.strengthScore || a.industryName.localeCompare(b.industryName, 'zh-Hant'))
      .map((item, index) => {
        const rank = index + 1
        const previousRank = input.previous?.industries.find((value) => value.industryId === item.industryId)?.rank ?? null
        const rankChange = previousRank === null ? null : previousRank - rank
        return { ...item, rank, previousRank, rankChange, direction: rankChange === null || rankChange === 0 ? 'flat' as const : rankChange > 0 ? 'up' as const : 'down' as const }
      })
    return {
      schemaVersion: '1.0', tradeDate: input.tradeDate, generatedAt: input.generatedAt ?? new Date().toISOString(), market: 'TWSE', industries: items,
      sources: [{ id: 'guli-industry-repository', name: 'GULI 產業與個股模擬資料', type: 'mock', fields: ['industries', 'stocks', 'institutionalNetBuy'] }, { id: 'guli-industry-rules', name: 'GULI Industry Snapshot Engine', type: 'derived', fields: ['scores', 'rank', 'status', 'risks'] }], warnings,
    }
  }

  async generateFromRepositories(tradeDate: string, previous?: IndustrySnapshot | null) {
    if (!this.industryRepository || !this.stockRepository || !this.institutionRepository) throw new Error('產業快照產生器尚未設定 Repository。')
    const [industryResult, stockResult] = await Promise.all([this.industryRepository.read(undefined), this.stockRepository.read(undefined)])
    await this.institutionRepository.read(undefined)
    return this.generate({ tradeDate, industries: industryResult.data, stocks: stockResult.data, previous })
  }

  private buildItem(industry: Industry, universe: Stock[], marketReturn: number, warnings: string[]): Omit<IndustrySnapshotItem, 'rank' | 'previousRank' | 'rankChange' | 'direction'> {
    const members = universe.filter((stock) => stock.industry === industry.name || industry.stockSymbols.includes(stock.symbol))
    if (!members.length) warnings.push(`${industry.name} 缺少成分股資料，分數採中性回退。`)
    const return1d = members.length ? average(members.map((stock) => stock.changePercent)) : null
    const returns5 = members.map((stock) => returnFor(stock, 5)).filter((value): value is number => value !== null)
    const returns20 = members.map((stock) => returnFor(stock, 20)).filter((value): value is number => value !== null)
    const return5d = returns5.length ? average(returns5) : null
    const return20d = returns20.length ? average(returns20) : null
    const advanceCount = members.length ? members.filter((stock) => stock.changePercent > 0).length : null
    const declineCount = members.length ? members.filter((stock) => stock.changePercent < 0).length : null
    const unchangedCount = members.length ? members.length - (advanceCount ?? 0) - (declineCount ?? 0) : null
    const institutionalNetBuy = members.length ? members.reduce((sum, stock) => sum + stock.institutions.total, 0) : null
    const tradingAmount = members.length ? members.reduce((sum, stock) => sum + stock.price * stock.volume * 1000, 0) : null
    const healthScores = members.map((stock) => calculateStockHealth(stock, universe).totalScore)
    const breadthRatio = members.length ? (advanceCount! + unchangedCount! * 0.5) / members.length : 0.5
    const capitalFlowScore = clamp(50 + industry.capitalFlow * 1.5 + (institutionalNetBuy ?? 0) / Math.max(25, members.length * 35))
    const momentumScore = clamp(50 + (return5d ?? 0) * 4 + (return20d ?? 0) * 1.5 + industry.momentum * 1.2)
    const breadthScore = clamp(breadthRatio * 100)
    const relativeStrengthScore = clamp(50 + ((return1d ?? 0) - marketReturn) * 10 + (average(healthScores) - 50) * 0.35)
    const avgVolatility = average(members.map((stock) => stock.volatility))
    const overheatRatio = members.length ? members.filter((stock) => stock.rsi > 75).length / members.length : 0
    const riskAdjustment = clamp(100 - avgVolatility * 12 - overheatRatio * 30)
    const riskScore = 100 - riskAdjustment
    const strengthScore = clamp(capitalFlowScore * .30 + momentumScore * .25 + breadthScore * .20 + relativeStrengthScore * .15 + riskAdjustment * .10)
    const ranked = members.map((stock) => ({ symbol: stock.symbol, name: stock.name, changePercent: stock.changePercent, healthScore: calculateStockHealth(stock, universe).totalScore })).sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))
    const leaderStocks = ranked.slice(0, Math.min(3, Math.ceil(ranked.length / 2)))
    const leaders = new Set(leaderStocks.map((stock) => stock.symbol))
    const laggardStocks = [...ranked].reverse().filter((stock) => !leaders.has(stock.symbol)).slice(0, Math.min(3, Math.floor(ranked.length / 2)))
    const risks = [avgVolatility > 2.2 ? '產業波動偏高' : '', overheatRatio >= .5 ? '成分股短線過熱' : '', institutionalNetBuy !== null && institutionalNetBuy < 0 ? '法人資金淨流出' : ''].filter(Boolean)
    const status = statusForIndustryScore(strengthScore)
    return { industryId: industry.id, industryName: industry.name, strengthScore, momentumScore, capitalFlowScore, breadthScore, relativeStrengthScore, riskScore, status, return1d, return5d, return20d, institutionalNetBuy, tradingAmount, advanceCount, declineCount, unchangedCount, leaderStocks, laggardStocks, risks, tags: [status, capitalFlowScore >= 66 ? '資金流入' : capitalFlowScore <= 35 ? '資金流出' : '資金中性', momentumScore >= 66 ? '動能升溫' : momentumScore <= 35 ? '動能轉弱' : '動能中性'], sources: [{ id: 'mock-industry', name: 'GULI Mock Data', type: 'mock', fields: ['returns', 'institutionalNetBuy', 'tradingAmount', 'breadth'] }, { id: 'industry-rules', name: 'GULI 規則計算', type: 'derived', fields: ['scores', 'status', 'risks'] }] }
  }
}
