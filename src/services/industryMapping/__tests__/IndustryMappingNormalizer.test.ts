import { describe,expect,it } from 'vitest'
import { normalizeIndustryCode, normalizeRocDate, normalizeTWSEIndustryMapping, TWSE_INDUSTRY_NAMES } from '../IndustryMappingNormalizer'

const universe=[{symbol:'2330',name:'台積電',instrumentType:'stock',market:'TWSE'},{symbol:'2317',name:'鴻海',instrumentType:'stock',market:'TWSE'},{symbol:'0050',name:'元大台灣50',instrumentType:'etf',market:'TWSE'},{symbol:'6488',name:'環球晶',instrumentType:'stock',market:'TPEX'}]
const options={fetchedAt:'2026-07-20T08:00:00.000Z',sourceUrl:'https://openapi.twse.com.tw/v1/opendata/t187ap03_L'}
describe('IndustryMappingNormalizer',()=>{
  it('converts a seven-digit ROC date',()=>expect(normalizeRocDate('1150719')).toBe('2026-07-19'))
  it('converts an eight-digit Gregorian date',()=>expect(normalizeRocDate('20260719')).toBe('2026-07-19'))
  it('rejects an impossible date',()=>expect(normalizeRocDate('1151399')).toBeNull())
  it('normalizes a one-digit industry code',()=>expect(normalizeIndustryCode('1')).toBe('01'))
  it('removes surrounding non-numeric characters from a code',()=>expect(normalizeIndustryCode(' 24 ')).toBe('24'))
  it('rejects an empty code',()=>expect(normalizeIndustryCode('—')).toBeNull())
  it('uses the official industry name table',()=>expect(TWSE_INDUSTRY_NAMES['24']).toBe('半導體業'))
  it('keeps the renamed tourism category',()=>expect(TWSE_INDUSTRY_NAMES['16']).toBe('觀光餐旅'))
  it('only keeps four-digit TWSE common stocks',()=>{const dataset=normalizeTWSEIndustryMapping([{出表日期:'1150719',公司代號:'2330',公司簡稱:'台積電',產業別:'24'}],universe,options);expect(dataset.stocks.map((row)=>row.symbol)).toEqual(['2317','2330'])})
  it('maps a known official industry',()=>{const dataset=normalizeTWSEIndustryMapping([{出表日期:'1150719',公司代號:'2330',公司簡稱:'台積電',產業別:'24'}],universe,options);expect(dataset.stocks.find((row)=>row.symbol==='2330')).toMatchObject({industryCode:'24',industryName:'半導體業',status:'official'})})
  it('does not guess a missing industry from the company name',()=>{const dataset=normalizeTWSEIndustryMapping([{出表日期:'1150719',公司代號:'2317',公司簡稱:'鴻海'}],universe,options);expect(dataset.stocks.find((row)=>row.symbol==='2317')).toMatchObject({industryCode:null,industryName:null,status:'missing'})})
  it('excludes official code 91 from the common-stock universe',()=>{const dataset=normalizeTWSEIndustryMapping([{出表日期:'1150719',公司代號:'2330',公司簡稱:'台積電',產業別:'91'}],universe,options);expect(dataset.stocks.some((row)=>row.symbol==='2330')).toBe(false)})
  it('deduplicates raw company rows by symbol',()=>{const dataset=normalizeTWSEIndustryMapping([{出表日期:'1150719',公司代號:'2330',公司簡稱:'台積電',產業別:'24'},{出表日期:'1150719',公司代號:'2330',公司簡稱:'重複',產業別:'25'}],universe,options);expect(dataset.stocks.filter((row)=>row.symbol==='2330')).toHaveLength(1);expect(dataset.stocks.find((row)=>row.symbol==='2330')?.industryCode).toBe('24')})
  it('reports exact mapped and unmapped counts',()=>{const dataset=normalizeTWSEIndustryMapping([{出表日期:'1150719',公司代號:'2330',公司簡稱:'台積電',產業別:'24'}],universe,options);expect([dataset.stockRecords,dataset.mappedStockCount,dataset.unmappedStockCount]).toEqual([2,1,1])})
})
