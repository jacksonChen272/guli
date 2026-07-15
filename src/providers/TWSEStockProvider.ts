import type { OfficialStockDailyDataset, OfficialStockDailyRecord, OfficialStockDatasetIndex, OfficialStockDatasetStatus, StockInstrumentType } from '../types/officialStockData'
import { isStockDatasetStale, validateOfficialStockDataset, validateStockDailyRecord } from '../services/stockData/StockDailyValidator'
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
export class TWSEStockProviderError extends Error { constructor(public readonly code: 'NOT_FOUND'|'NETWORK'|'INVALID_JSON'|'INVALID_DATASET', message: string) { super(message); this.name='TWSEStockProviderError' } }
const emptyCounts=():Record<StockInstrumentType,number>=>({stock:0,etf:0,etn:0,warrant:0,unknown:0})
export class TWSEStockProvider {
  private cache=new Map<string,{value:unknown;expiresAt:number}>()
  constructor(private readonly fetcher:Fetcher=globalThis.fetch.bind(globalThis),private readonly baseUrl=import.meta.env.BASE_URL,private readonly ttlMs=300_000){}
  private async read<T>(path:string,validate:(value:unknown)=>value is T):Promise<T>{const cached=this.cache.get(path);if(cached&&cached.expiresAt>Date.now())return cached.value as T;let response:Response;try{response=await this.fetcher(`${this.baseUrl}${path}`,{cache:'no-cache',headers:{accept:'application/json'}})}catch{throw new TWSEStockProviderError('NETWORK','無法讀取 TWSE 個股靜態資料。')}if(!response.ok)throw new TWSEStockProviderError('NOT_FOUND','TWSE 個股資料檔不存在。');let value:unknown;try{value=await response.json()}catch{throw new TWSEStockProviderError('INVALID_JSON','TWSE 個股資料不是有效 JSON。')}if(!validate(value))throw new TWSEStockProviderError('INVALID_DATASET','TWSE 個股資料驗證失敗。');this.cache.set(path,{value,expiresAt:Date.now()+this.ttlMs});return value}
  getLatestDataset(){return this.read('data/twse-stocks/latest.json',isDataset)}
  async getStock(symbol:string){return (await this.getLatestDataset()).records.find((record)=>record.symbol===symbol)}
  async getStocks(symbols?:string[]){const records=(await this.getLatestDataset()).records;if(!symbols?.length)return records;const wanted=new Set(symbols);return records.filter((record)=>wanted.has(record.symbol))}
  async getAvailableDates(){return (await this.read('data/twse-stocks/index.json',isIndex)).datasets.map((item)=>item.tradeDate)}
  getDatasetByDate(date:string){return this.read(`data/twse-stocks/history/${date}.json`,isDataset)}
  async getLastUpdatedAt(){return (await this.getLatestDataset()).fetchedAt}
  async getStatus():Promise<OfficialStockDatasetStatus>{try{const dataset=await this.getLatestDataset();const counts=emptyCounts();dataset.records.forEach((record)=>counts[record.instrumentType]++);return{available:true,tradeDate:dataset.tradeDate,fetchedAt:dataset.fetchedAt,recordCount:dataset.records.length,status:dataset.status,stale:isStockDatasetStale(dataset.tradeDate),warnings:dataset.warnings,instrumentCounts:counts}}catch(error){return{available:false,tradeDate:null,fetchedAt:null,recordCount:0,status:'missing',stale:true,warnings:[error instanceof Error?error.message:'TWSE 個股資料不可用。'],instrumentCounts:emptyCounts()}}}
  clearCache(){this.cache.clear()}
}
const isDataset=(value:unknown):value is OfficialStockDailyDataset=>{if(!value||typeof value!=='object')return false;const dataset=value as OfficialStockDailyDataset;return validateOfficialStockDataset(dataset).valid&&dataset.records.every((record:OfficialStockDailyRecord)=>validateStockDailyRecord(record).valid&&record.status!=='invalid')}
const isIndex=(value:unknown):value is OfficialStockDatasetIndex=>!!value&&typeof value==='object'&&(value as Partial<OfficialStockDatasetIndex>).schemaVersion==='1.0'&&Array.isArray((value as Partial<OfficialStockDatasetIndex>).datasets)
