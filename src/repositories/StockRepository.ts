import type { CacheStore } from '../cache/Cache'
import type { CachePolicy } from '../cache/CachePolicy'
import { MockProvider } from '../providers/MockProvider'
import type { GuliDataProvider } from '../providers/ProviderTypes'
import { TWSEStockProvider } from '../providers/TWSEStockProvider'
import type { CombinedStockData } from '../types/officialStockData'
import type { Stock } from '../types/stock'
import { BaseRepository } from './BaseRepository'
export class StockRepository extends BaseRepository<Stock[],void>{
  constructor(private readonly provider:GuliDataProvider,cache:CacheStore,policy:CachePolicy,private readonly officialProvider=new TWSEStockProvider()){super('stocks','stocks',cache,policy)}
  protected fetch(){return this.provider.getStocks()}
  getBySymbol(symbol:string){return this.provider.getStockDetail(symbol)}
  getSnapshot(){if(this.provider instanceof MockProvider)return this.provider.getSnapshot().stocks;throw new Error('目前 Provider 不提供同步股票快照。')}
  async getOfficialQuote(symbol:string){const record=await this.officialProvider.getStock(symbol);return record?.instrumentType==='stock'&&record.status!=='invalid'?record:undefined}
  async getOfficialStocks(symbols?:string[]){return(await this.officialProvider.getStocks(symbols)).filter((record)=>record.instrumentType==='stock'&&record.status!=='invalid')}
  getOfficialDatasetStatus(){return this.officialProvider.getStatus()}
  async refreshOfficialData(){this.officialProvider.clearCache();return this.officialProvider.getLatestDataset()}
  async getCombinedStock(symbol:string):Promise<CombinedStockData>{try{const quote=await this.getOfficialQuote(symbol);return{quote:quote??null,institutional:'mock',technicalIndicators:'derived',healthScore:'derived',fallback:!quote,warnings:quote?quote.warnings:['找不到可用的 TWSE 上市股票正式報價，價格回退 Mock。']}}catch(error){return{quote:null,institutional:'mock',technicalIndicators:'derived',healthScore:'derived',fallback:true,warnings:[error instanceof Error?error.message:'正式報價不可用。']}}}
}
