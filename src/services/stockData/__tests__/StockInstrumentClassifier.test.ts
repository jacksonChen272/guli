import { describe,expect,it } from 'vitest'
import { classifyStockInstrument } from '../StockInstrumentClassifier'
describe('StockInstrumentClassifier',()=>{
  it('classifies four-digit listed stocks',()=>expect(classifyStockInstrument('2330','台積電')).toBe('stock'))
  it('classifies short and long ETF symbols',()=>{expect(classifyStockInstrument('0050','元大台灣50')).toBe('etf');expect(classifyStockInstrument('006208','富邦台50')).toBe('etf')})
  it('classifies ETN symbols',()=>expect(classifyStockInstrument('020001','富邦存股雙十N')).toBe('etn'))
  it('classifies warrants only with reliable name evidence',()=>expect(classifyStockInstrument('03037P','台積電元大購01')).toBe('warrant'))
  it('keeps uncertain instruments unknown',()=>expect(classifyStockInstrument('9941A','裕融甲特')).toBe('unknown'))
})
