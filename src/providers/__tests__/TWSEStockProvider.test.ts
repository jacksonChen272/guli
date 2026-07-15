import { describe,expect,it,vi } from 'vitest'
import type { OfficialStockDailyDataset } from '../../types/officialStockData'
import { TWSEStockProvider } from '../TWSEStockProvider'
const dataset:OfficialStockDailyDataset={schemaVersion:'1.0',market:'TWSE',tradeDate:'2026-07-13',fetchedAt:'2026-07-14T01:00:00.000Z',source:{name:'TWSE',endpoint:'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL'},status:'partial',warnings:['bid ask unavailable'],records:[{symbol:'2330',name:'台積電',tradeDate:'2026-07-13',market:'TWSE',instrumentType:'stock',tradeVolume:100,transactionCount:10,tradeValue:1000,open:100,high:105,low:95,close:102,changeDirection:'up',change:2,bidPrice:null,bidVolume:null,askPrice:null,askVolume:null,peRatio:20,source:'TWSE',fetchedAt:'2026-07-14T01:00:00.000Z',status:'official',warnings:[]}]}
describe('TWSEStockProvider',()=>{
  it('reads valid JSON once and serves provider cache',async()=>{const fetcher=vi.fn(async()=>new Response(JSON.stringify(dataset),{status:200}));const provider=new TWSEStockProvider(fetcher,'/guli/',1000);expect((await provider.getStock('2330'))?.close).toBe(102);await provider.getStock('2330');expect(fetcher).toHaveBeenCalledTimes(1)})
  it('returns structured missing status instead of throwing to UI',async()=>{const provider=new TWSEStockProvider(async()=>new Response('',{status:404}),'/guli/');const status=await provider.getStatus();expect(status.available).toBe(false);expect(status.status).toBe('missing')})
  it('rejects incompatible JSON datasets',async()=>{const provider=new TWSEStockProvider(async()=>new Response(JSON.stringify({...dataset,schemaVersion:'2.0'}),{status:200}),'/guli/');await expect(provider.getLatestDataset()).rejects.toThrow('驗證失敗')})
})
