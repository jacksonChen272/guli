export type InstitutionalInvestorType = 'foreign' | 'trust' | 'dealer' | 'total'
export type InstitutionalDatasetState = 'official' | 'partial' | 'missing' | 'stale'

export interface InstitutionalAmount {
  buyAmount: number | null
  sellAmount: number | null
  netAmount: number | null
}

export type InstitutionalMarketTotals = Record<InstitutionalInvestorType, InstitutionalAmount>

export interface OfficialStockInstitutionalRecord {
  symbol: string
  name: string
  foreignNetShares: number | null
  trustNetShares: number | null
  dealerNetShares: number | null
  totalNetShares: number | null
  tradeDate: string
  source: 'TWSE'
  fetchedAt: string
  status: 'official' | 'partial'
  warnings: string[]
}

export interface OfficialInstitutionalDataset {
  schemaVersion: '1.0'
  market: 'TWSE'
  tradeDate: string
  fetchedAt: string
  units: { marketTotals: 'TWD'; stockNet: 'shares' }
  marketTotals: InstitutionalMarketTotals
  records: OfficialStockInstitutionalRecord[]
  source: {
    name: '臺灣證券交易所（TWSE）'
    marketEndpoint: string
    stockEndpoint: string
  }
  status: 'official' | 'partial'
  warnings: string[]
}

export interface InstitutionalDatasetStatus {
  available: boolean
  tradeDate: string | null
  fetchedAt: string | null
  recordCount: number
  status: InstitutionalDatasetState
  stale: boolean
  warnings: string[]
}

export interface OfficialInstitutionalIndex {
  schemaVersion: '1.0'
  latestTradeDate: string
  updatedAt: string
  datasets: Array<{ tradeDate: string; path: string; recordCount: number; status: 'official' | 'partial' }>
}
