import type { OfficialIndustryStock } from '../../types/officialIndustryMapping'

export interface DerivedIndustryGroup { industryId: string; industryName: string; source: 'official' | 'derived' | 'missing' }

export function mergeOfficialAndDerivedIndustry(
  official: OfficialIndustryStock | undefined,
  derived: DerivedIndustryGroup | undefined,
): DerivedIndustryGroup {
  if (official?.status === 'official' && official.industryCode && official.industryName) return { industryId: official.industryCode, industryName: official.industryName, source: 'official' }
  if (derived?.industryId && derived.industryName) return { ...derived, source: 'derived' }
  return { industryId: 'unclassified', industryName: '未分類', source: 'missing' }
}

export function mergeIndustryMaps(official: OfficialIndustryStock[], derived: Map<string, DerivedIndustryGroup>) {
  return new Map(official.map((stock) => [stock.symbol, mergeOfficialAndDerivedIndustry(stock, derived.get(stock.symbol))]))
}
