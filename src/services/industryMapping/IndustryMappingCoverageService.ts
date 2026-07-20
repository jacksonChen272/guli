import type { IndustryMappingCoverage, OfficialIndustryMappingDataset } from '../../types/officialIndustryMapping'

export function calculateIndustryMappingCoverage(dataset: OfficialIndustryMappingDataset): IndustryMappingCoverage {
  const totalStocks = dataset.stocks.length
  const mappedStocks = dataset.stocks.filter((stock) => stock.status === 'official' && stock.industryCode !== null).length
  const unmappedStocks = totalStocks - mappedStocks
  return { totalStocks, mappedStocks, unmappedStocks, industryCount: new Set(dataset.stocks.map((stock) => stock.industryCode).filter(Boolean)).size, coverageRate: totalStocks ? Number((mappedStocks / totalStocks * 100).toFixed(2)) : 0 }
}

export function calculateDerivedCoverage(totalStocks: number, officialMapped: number, derivedMapped: number) {
  return totalStocks ? Number(((officialMapped + derivedMapped) / totalStocks * 100).toFixed(2)) : 0
}
