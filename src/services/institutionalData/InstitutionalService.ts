import type { InstitutionalInvestorType, OfficialStockInstitutionalRecord } from '../../types/officialInstitutionalData'

export const toHundredMillionTWD = (value: number | null) => value === null ? null : value / 100_000_000
export const toLots = (value: number | null) => value === null ? null : value / 1_000
export const getInstitutionalNetShares = (record: OfficialStockInstitutionalRecord, type: InstitutionalInvestorType) => ({ foreign: record.foreignNetShares, trust: record.trustNetShares, dealer: record.dealerNetShares, total: record.totalNetShares })[type]
export const rankInstitutionalRecords = (records: OfficialStockInstitutionalRecord[], type: InstitutionalInvestorType, direction: 'buy' | 'sell', limit = 10) => records
  .filter((record) => getInstitutionalNetShares(record, type) !== null)
  .sort((a, b) => direction === 'buy' ? (getInstitutionalNetShares(b, type) ?? 0) - (getInstitutionalNetShares(a, type) ?? 0) : (getInstitutionalNetShares(a, type) ?? 0) - (getInstitutionalNetShares(b, type) ?? 0))
  .slice(0, Math.max(0, limit))
