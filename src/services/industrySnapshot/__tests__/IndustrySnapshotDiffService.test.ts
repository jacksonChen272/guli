import { describe, expect, it } from 'vitest'
import type { IndustrySnapshot } from '../../../types/industrySnapshot'
import { IndustrySnapshotDiffService } from '../IndustrySnapshotDiffService'
const item=(id:string,rank:number,strength=60)=>({industryId:id,industryName:id,rank,previousRank:null,rankChange:null,strengthScore:strength,momentumScore:strength,capitalFlowScore:strength,breadthScore:strength,relativeStrengthScore:strength,riskScore:20,status:'中性' as const,direction:'flat' as const,return1d:null,return5d:null,return20d:null,institutionalNetBuy:null,tradingAmount:null,advanceCount:null,declineCount:null,unchangedCount:null,leaderStocks:[],laggardStocks:[],risks:[],tags:[],sources:[]})
const snap=(date:string,ids:string[]):IndustrySnapshot=>({schemaVersion:'1.0',tradeDate:date,generatedAt:`${date}T08:00:00.000Z`,market:'TWSE',industries:ids.map((id,index)=>item(id,index+1,60+index)),sources:[],warnings:[]})
describe('IndustrySnapshotDiffService',()=>{ const service=new IndustrySnapshotDiffService()
  it('calculates rank changes for the same industry',()=>{const diff=service.compare(snap('2026-07-02',['b','a']),snap('2026-07-01',['a','b']));expect(diff.changes.find((value)=>value.industryId==='b')?.rankChange).toBe(1)})
  it('calculates score changes',()=>{const current=snap('2026-07-02',['a']);current.industries[0].strengthScore=75;const diff=service.compare(current,snap('2026-07-01',['a']));expect(diff.changes[0].strengthChange).toBe(15)})
  it('detects entries and exits from the top five',()=>{const diff=service.compare(snap('2026-07-02',['f','a','b','c','d','e']),snap('2026-07-01',['a','b','c','d','e','f']));expect(diff.enteredTopFive).toContain('f');expect(diff.exitedTopFive).toContain('e')})
  it('returns null deltas without a previous snapshot',()=>{const diff=service.compare(snap('2026-07-02',['a']));expect(diff.previousDate).toBeNull();expect(diff.changes[0].rankChange).toBeNull()})
})
