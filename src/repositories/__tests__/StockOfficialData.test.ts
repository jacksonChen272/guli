import { describe,expect,it,vi } from 'vitest'
import { CachePolicy } from '../../cache/CachePolicy'
import { MemoryCache } from '../../cache/MemoryCache'
import { MockProvider } from '../../providers/MockProvider'
import { TWSEStockProvider } from '../../providers/TWSEStockProvider'
import type { OfficialStockDailyDataset } from '../../types/officialStockData'
import { StockRepository } from '../StockRepository'
const base={symbol:'2330',name:'台積電',tradeDate:'2026-07-13',market:'TWSE' as const,instrumentType:'stock' as const,tradeVolume:100,transactionCount:10,tradeValue:1000,open:100,high:105,low:95,close:102,changeDirection:'up' as const,change:2,bidPrice:null,bidVolume:null,askPrice:null,askVolume:null,peRatio:20,source:'TWSE' as const,fetchedAt:'2026-07-14T01:00:00.000Z',status:'official' as const,warnings:[]}
const dataset:OfficialStockDailyDataset={schemaVersion:'1.0',market:'TWSE',tradeDate:'2026-07-13',fetchedAt:'2026-07-14T01:00:00.000Z',records:[base],source:{name:'TWSE',endpoint:'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL'},status:'partial',warnings:[]}
describe('StockRepository official data',()=>{
  it('returns combined official quote with mock and derived provenance',async()=>{const provider=new TWSEStockProvider(vi.fn(async()=>new Response(JSON.stringify(dataset),{status:200})),'/guli/');const repository=new StockRepository(new MockProvider(),new MemoryCache(),new CachePolicy(),provider);const result=await repository.getCombinedStock('2330');expect(result.quote?.close).toBe(102);expect(result).toMatchObject({institutional:'mock',technicalIndicators:'derived',healthScore:'derived',fallback:false})})
  it('falls back safely when official JSON is missing',async()=>{const provider=new TWSEStockProvider(async()=>new Response('',{status:404}),'/guli/');const repository=new StockRepository(new MockProvider(),new MemoryCache(),new CachePolicy(),provider);const result=await repository.getCombinedStock('2330');expect(result.quote).toBeNull();expect(result.fallback).toBe(true);expect(result.warnings.length).toBeGreaterThan(0)})
  it('does not expose ETF records as official stock quotes',async()=>{const provider=new TWSEStockProvider(async()=>new Response(JSON.stringify({...dataset,records:[{...base,symbol:'0050',instrumentType:'etf'}]}),{status:200}),'/guli/');const repository=new StockRepository(new MockProvider(),new MemoryCache(),new CachePolicy(),provider);expect(await repository.getOfficialQuote('0050')).toBeUndefined()})
})
