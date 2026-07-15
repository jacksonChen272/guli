import { describe, expect, it } from 'vitest'
import type { IndustrySnapshot } from '../../../types/industrySnapshot'
import { IndustryMemoryService } from '../IndustryMemoryService'
const make=(date:string,ranks:string[]):IndustrySnapshot=>({schemaVersion:'1.0',tradeDate:date,generatedAt:`${date}T08:00:00Z`,market:'TWSE',industries:ranks.map((id,index)=>({industryId:id,industryName:id,rank:index+1,previousRank:null,rankChange:null,strengthScore:id==='a'?80:40,momentumScore:50,capitalFlowScore:50,breadthScore:50,relativeStrengthScore:50,riskScore:20,status:id==='a'?'偏強':'偏弱',direction:'flat',return1d:null,return5d:null,return20d:null,institutionalNetBuy:null,tradingAmount:null,advanceCount:null,declineCount:null,unchangedCount:null,leaderStocks:[],laggardStocks:[],risks:[],tags:[],sources:[]})),sources:[],warnings:[]})
describe('IndustryMemoryService',()=>{const history=[make('2026-07-01',['a','b','c','d','e','f']),make('2026-07-02',['a','b','c','f','d','e']),make('2026-07-03',['a','f','b','c','d','e'])];const memory=new IndustryMemoryService().calculate(history,5)
  it('uses only actual snapshots and reports insufficient history',()=>{expect(memory.snapshotCount).toBe(3);expect(memory.insufficientData).toBe(true)})
  it('finds frequent top industries and strong streaks',()=>{expect(memory.frequentTopFive[0].industryName).toBe('a');expect(memory.longestStrongStreak?.industryName).toBe('a');expect(memory.longestStrongStreak?.value).toBe(3)})
  it('finds improved and declined ranks',()=>{expect(memory.mostImproved?.industryName).toBe('f');expect(memory.mostImproved?.value).toBeGreaterThan(0);expect(memory.mostDeclined?.value).toBeLessThan(0)})
})
