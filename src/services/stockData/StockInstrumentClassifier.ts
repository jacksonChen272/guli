import type { StockInstrumentType } from '../../types/officialStockData'

export function classifyStockInstrument(symbol: string, name = ''): StockInstrumentType {
  const code = symbol.trim().toUpperCase()
  const label = name.trim()
  if (/^020\d{3}$/.test(code) || /ETN/i.test(label)) return 'etn'
  if (/^00\d{2,4}[A-Z]?$/.test(code) || /ETF/i.test(label)) return 'etf'
  if (/[購售]/.test(label)) return 'warrant'
  if (/^\d{4}$/.test(code)) return 'stock'
  return 'unknown'
}
