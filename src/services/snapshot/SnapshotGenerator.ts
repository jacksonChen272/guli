import { repositoryHub } from '../../repositories/RepositoryHub'
import { generateMarketHeadline } from '../marketInsightService'
import type { Industry } from '../../types/industry'
import type { MarketOverviewData } from '../../types/api'
import type { MarketSnapshot, MarketSnapshotRisk, SnapshotSource } from '../../types/snapshot'
import { marketStatusForTemperature } from './SnapshotFormatter'

export interface SnapshotGeneratorInput { overview: MarketOverviewData; industries: Industry[]; headline?: string; generatedAt?: string }
const industryEntry = (industry: Industry, rank: number) => ({ name: industry.name, changePercent: industry.changePercent, capitalFlow: industry.capitalFlow, momentum: industry.momentum, rank, source: 'mock' as const })

export class SnapshotGenerator {
  generate(input: SnapshotGeneratorInput): MarketSnapshot {
    const official = input.overview.officialMarket
    const industries = [...input.industries].sort((a, b) => b.changePercent - a.changePercent)
    const topIndustries = industries.slice(0, 3).map((industry, index) => industryEntry(industry, index + 1))
    const weakIndustries = industries.slice(-3).reverse().filter((industry) => !topIndustries.some((top) => top.name === industry.name)).map((industry, index) => industryEntry(industry, index + 1))
    const temperature = Math.max(0, Math.min(100, input.overview.temperature.score))
    const tradeDate = official?.tradeDate ?? input.overview.indices[0]?.trend.at(-1)?.date ?? ''
    const sources: SnapshotSource[] = [
      { id: 'twse-overview', name: official?.source ?? 'TWSE 資料未取得', type: official ? official.status === 'fallback' ? 'fallback' : 'official' : 'fallback', fields: ['overview'], tradeDate: official?.tradeDate, status: official?.status },
      { id: 'guli-industries', name: 'GULI 集中 Mock Data', type: 'mock', fields: ['marketTemperature', 'topIndustries', 'weakIndustries', 'risks'] },
      { id: 'guli-rules', name: 'GULI 規則引擎', type: 'derived', fields: ['marketStatus', 'confidence', 'headline', 'tags'] },
    ]
    const risks: MarketSnapshotRisk[] = []
    if (!official || official.status !== 'official') risks.push({ id: 'official-partial', level: '中', title: '官方資料不完整', description: official?.warnings[0] ?? '目前未取得正式 TWSE 市場總覽。', source: official ? 'official' : 'fallback' })
    if (weakIndustries[0]) risks.push({ id: 'weak-sector', level: '中', title: `${weakIndustries[0].name}動能偏弱`, description: `產業漲跌幅 ${weakIndustries[0].changePercent.toFixed(2)}%，需留意資金持續流出。`, source: 'derived' })
    const confidence = official?.status === 'official' ? 82 : official?.status === 'partial' ? 72 : 55
    const warnings = [...(official?.warnings ?? []), '產業、法人、訊號與市場溫度仍使用模擬或規則推導資料。']
    return { schemaVersion: '1.0', snapshotId: `twse-${tradeDate}`, tradeDate, generatedAt: input.generatedAt ?? official?.fetchedAt ?? new Date().toISOString(), market: 'TWSE', marketStatus: marketStatusForTemperature(temperature), marketTemperature: temperature, confidence, headline: input.headline ?? `市場${marketStatusForTemperature(temperature)}，資金聚焦${topIndustries.slice(0, 2).map((item) => item.name).join('與')}。`, overview: official ? { indexValue: official.indexValue, change: official.change, changePercent: official.changePercent, tradingAmount: official.tradingAmount, advanceCount: official.advanceCount, declineCount: official.declineCount, unchangedCount: official.unchangedCount } : { indexValue: null, change: null, changePercent: null, tradingAmount: null, advanceCount: null, declineCount: null, unchangedCount: null }, topIndustries, weakIndustries, risks, tags: [marketStatusForTemperature(temperature), ...topIndustries.slice(0, 2).map((item) => item.name)], sources, warnings }
  }
  generateFromRepositories() { const snapshot = repositoryHub.getSnapshot(); return this.generate({ overview: snapshot.overview, industries: snapshot.industries, headline: generateMarketHeadline().headline }) }
}
