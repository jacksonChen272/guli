export type IndustryMappingRecordStatus = 'official' | 'missing'
export type IndustryMappingDatasetStatus = 'official' | 'partial'

export interface OfficialIndustryDefinition {
  industryCode: string
  industryName: string
  stockCount: number
  source: 'TWSE'
  status: 'official'
}

export interface OfficialIndustryStock {
  symbol: string
  name: string
  market: 'TWSE'
  instrumentType: 'stock'
  industryCode: string | null
  industryName: string | null
  source: 'TWSE'
  status: IndustryMappingRecordStatus
  updatedAt: string
}

export interface OfficialIndustryMappingDataset {
  schemaVersion: '1.0'
  market: 'TWSE'
  source: 'TWSE'
  sourceUrl: string
  fetchedAt: string
  effectiveDate: string
  totalRecords: number
  stockRecords: number
  excludedRecords: number
  mappedStockCount: number
  unmappedStockCount: number
  status: IndustryMappingDatasetStatus
  warnings: string[]
  industries: OfficialIndustryDefinition[]
  stocks: OfficialIndustryStock[]
}

export interface OfficialIndustryMappingIndexEntry {
  effectiveDate: string
  path: string
  stockRecords: number
  mappedStockCount: number
  coverageRate: number
  status: IndustryMappingDatasetStatus
}

export interface OfficialIndustryMappingIndex {
  schemaVersion: '1.0'
  updatedAt: string
  latestEffectiveDate: string | null
  datasets: OfficialIndustryMappingIndexEntry[]
}

export interface IndustryMappingCoverage {
  totalStocks: number
  mappedStocks: number
  unmappedStocks: number
  industryCount: number
  coverageRate: number
}

export interface IndustryMappingDatasetStatusResult extends IndustryMappingCoverage {
  available: boolean
  status: IndustryMappingDatasetStatus | 'missing' | 'invalid'
  effectiveDate: string | null
  fetchedAt: string | null
  stale: boolean
  warnings: string[]
}
