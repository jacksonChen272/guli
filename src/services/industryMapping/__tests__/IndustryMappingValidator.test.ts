import { describe,expect,it } from 'vitest'
import { isIndustryMappingStale, validateIndustryMappingDataset } from '../IndustryMappingValidator'
import type { OfficialIndustryMappingDataset } from '../../../types/officialIndustryMapping'

const make=():OfficialIndustryMappingDataset=>({schemaVersion:'1.0',market:'TWSE',source:'TWSE',sourceUrl:'https://openapi.twse.com.tw/v1/opendata/t187ap03_L',fetchedAt:'2026-07-20T08:00:00.000Z',effectiveDate:'2026-07-19',totalRecords:1,stockRecords:1,excludedRecords:0,mappedStockCount:1,unmappedStockCount:0,status:'official',warnings:[],industries:[{industryCode:'24',industryName:'半導體業',stockCount:1,source:'TWSE',status:'official'}],stocks:[{symbol:'2330',name:'台積電',market:'TWSE',instrumentType:'stock',industryCode:'24',industryName:'半導體業',source:'TWSE',status:'official',updatedAt:'2026-07-20T08:00:00.000Z'}]})
describe('IndustryMappingValidator',()=>{
  it('accepts a valid official dataset',()=>expect(validateIndustryMappingDataset(make()).valid).toBe(true))
  it('rejects a third-party source URL',()=>expect(validateIndustryMappingDataset({...make(),sourceUrl:'https://example.com/data'}).errors.join(' ')).toContain('官方網域'))
  it('rejects a duplicate symbol',()=>{const data=make();data.stocks.push({...data.stocks[0]});data.stockRecords=2;data.mappedStockCount=2;expect(validateIndustryMappingDataset(data).errors.join(' ')).toContain('重複')})
  it('rejects a non-four-digit symbol',()=>{const data=make();data.stocks[0]={...data.stocks[0],symbol:'0050A'};expect(validateIndustryMappingDataset(data).valid).toBe(false)})
  it('rejects a stock outside the official universe',()=>expect(validateIndustryMappingDataset(make(),new Set(['2317'])).errors.join(' ')).toContain('universe'))
  it('rejects code and name conflicts',()=>{const data=make();data.stocks[0]={...data.stocks[0],industryName:'航運業'};expect(validateIndustryMappingDataset(data).errors.join(' ')).toContain('衝突')})
  it('requires readable Chinese in official industry names',()=>{const data=make();data.stocks[0]={...data.stocks[0],industryName:'Semiconductor'};expect(validateIndustryMappingDataset(data).valid).toBe(false)})
  it('requires null fields for missing records',()=>{const data=make();data.stocks[0]={...data.stocks[0],status:'missing',industryName:'半導體業'};expect(validateIndustryMappingDataset(data).errors.join(' ')).toContain('null')})
  it('rejects inconsistent counters',()=>expect(validateIndustryMappingDataset({...make(),mappedStockCount:0}).errors.join(' ')).toContain('合計'))
  it('marks old monthly data stale',()=>expect(isIndustryMappingStale('2026-01-01',new Date('2026-07-20T00:00:00Z'))).toBe(true))
  it('keeps a recent monthly mapping fresh',()=>expect(isIndustryMappingStale('2026-07-01',new Date('2026-07-20T00:00:00Z'))).toBe(false))
})
