import { describe,expect,it } from 'vitest'
import type { OfficialStockDailyRecord } from '../../../types/officialStockData'
import { validateStockDailyRecord } from '../StockDailyValidator'
const record=(overrides:Partial<OfficialStockDailyRecord>={}):OfficialStockDailyRecord=>({symbol:'2330',name:'台積電',tradeDate:'2026-07-13',market:'TWSE',instrumentType:'stock',tradeVolume:100,transactionCount:10,tradeValue:1000,open:100,high:105,low:95,close:102,changeDirection:'up',change:2,bidPrice:null,bidVolume:null,askPrice:null,askVolume:null,peRatio:20,source:'TWSE',fetchedAt:'2026-07-14T01:00:00.000Z',status:'official',warnings:[],...overrides})
describe('StockDailyValidator',()=>{
  it('accepts a valid official stock row',()=>expect(validateStockDailyRecord(record()).valid).toBe(true))
  it('rejects invalid dates',()=>expect(validateStockDailyRecord(record({tradeDate:'115/07/13'})).valid).toBe(false))
  it('rejects high below low',()=>expect(validateStockDailyRecord(record({high:90,low:95})).errors).toContain('最高價不可低於最低價。'))
  it('rejects close above high',()=>expect(validateStockDailyRecord(record({close:110})).errors.some((error)=>error.includes('close'))).toBe(true))
  it('allows missing optional quote fields and emits bid ask warning',()=>{const result=validateStockDailyRecord(record({open:null,high:null,low:null,close:null}));expect(result.valid).toBe(true);expect(result.warnings.some((warning)=>warning.includes('最佳買賣'))).toBe(true)})
  it('rejects negative trading metrics',()=>expect(validateStockDailyRecord(record({tradeValue:-1})).valid).toBe(false))
})
