import type { MarketOverviewData } from '../types/api'
import type { OfficialMarketOverview } from '../types/marketData'
import type { Stock } from '../types/stock'
import { validateOfficialMarketOverview } from './dataValidationService'
import type { MarketSnapshot } from '../types/snapshot'
import { validateMarketSnapshot } from './snapshotValidationService'

export type DataQualityGrade = '優良' | '良好' | '待確認' | '需處理'
export interface DataQualityReport { score: number; grade: DataQualityGrade; issues: string[]; checkedAt: string }

const gradeFor = (score: number): DataQualityGrade => score >= 95 ? '優良' : score >= 80 ? '良好' : score >= 60 ? '待確認' : '需處理'

export class DataQuality {
  evaluate(stocks: Stock[], overview: MarketOverviewData): DataQualityReport {
    const issues: string[] = []
    if (!stocks.length) issues.push('沒有股票資料')
    const invalidPrices = stocks.filter((stock) => !Number.isFinite(stock.price) || stock.price < 0).length
    if (invalidPrices) issues.push(`${invalidPrices} 檔股票價格無效`)
    const invalidVolumes = stocks.filter((stock) => !Number.isFinite(stock.volume) || stock.volume < 0).length
    if (invalidVolumes) issues.push(`${invalidVolumes} 檔股票成交量無效`)
    const incompleteHistory = stocks.filter((stock) => stock.priceHistory.length < 20).length
    if (incompleteHistory) issues.push(`${incompleteHistory} 檔歷史資料不足`)
    if (overview.indices.length < 2) issues.push('市場指數資料不完整')
    const score = Math.max(0, 100 - invalidPrices * 8 - invalidVolumes * 8 - incompleteHistory * 2 - (overview.indices.length < 2 ? 20 : 0))
    return { score, grade: gradeFor(score), issues, checkedAt: new Date().toISOString() }
  }

  evaluateOfficial(data: OfficialMarketOverview, now = new Date()): DataQualityReport {
    const validation = validateOfficialMarketOverview(data, now)
    const missingBreadth = [data.advanceCount, data.declineCount, data.unchangedCount].filter((value) => value === null).length
    const score = Math.max(0, 100 - validation.errors.length * 25 - missingBreadth * 5 - (validation.stale ? 15 : 0))
    return { score, grade: gradeFor(score), issues: [...new Set([...validation.errors, ...validation.warnings])], checkedAt: new Date().toISOString() }
  }
  evaluateSnapshot(snapshot: MarketSnapshot): DataQualityReport {
    const validation = validateMarketSnapshot(snapshot)
    const score = Math.max(0, 100 - validation.errors.length * 20 - validation.warnings.length * 5)
    return { score, grade: gradeFor(score), issues: [...validation.errors, ...validation.warnings], checkedAt: new Date().toISOString() }
  }
}

export const dataQuality = new DataQuality()
