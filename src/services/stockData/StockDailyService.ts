import type { StockRepository } from '../../repositories/StockRepository'
import { repositoryHub } from '../../repositories/RepositoryHub'
export class StockDailyService { constructor(private readonly repository:StockRepository){} getStock(symbol:string){return this.repository.getOfficialQuote(symbol)} getStocks(symbols?:string[]){return this.repository.getOfficialStocks(symbols)} getStatus(){return this.repository.getOfficialDatasetStatus()} refresh(){return this.repository.refreshOfficialData()} }
export const stockDailyService=new StockDailyService(repositoryHub.stocks)
