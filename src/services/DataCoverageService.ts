import type { DataCoverageReport } from '../types/dataCoverage'

export interface CoverageInput {
  marketAvailable:boolean;stockRecords:number;targetStocks:number;institutionalRecords:number;institutionalTarget:number;industryOfficialRecords:number;industryTarget:number;historyDays:number;updatedAt:string|null;stale:boolean
  industryMappedStockCount?:number;industryUnmappedStockCount?:number;industryCount?:number;industryCoveragePercent?:number;heatmapStockCount?:number;industrySnapshotCount?:number;industryTechnicalJoinCount?:number;industryDecisionJoinCount?:number;industryMappingUpdatedAt?:string|null;industryMappingStale?:boolean
  historyStockCoverageCount?:number;historyAverageDays?:number;historyComplete250Percent?:number;indicatorComputablePercent?:number;historyStaleCount?:number;historyFailedSymbols?:string[];totalCommonStocks?:number;historyComplete250Count?:number;technicalIndexCount?:number;technicalScoreAvailableCount?:number;decisionJoinCount?:number;institutionalJoinCount?:number;alignedCount?:number;mismatchedCount?:number;backfillCompleted?:number;backfillTotal?:number;backfillStatus?:string
}

const percent=(value:number,target:number)=>target<=0?0:Math.max(0,Math.min(100,Math.round(value/target*100)))
const bounded=(value=0)=>Math.max(0,Math.min(100,Math.round(value)))

export function calculateDataCoverage(input:CoverageInput):DataCoverageReport{
  const institutional=percent(input.institutionalRecords,input.institutionalTarget)
  const industryCoverage=input.industryCoveragePercent??percent(input.industryOfficialRecords,input.industryTarget)
  const industryAvailable=(input.industryMappedStockCount??input.industryOfficialRecords)>0
  return{
    marketOfficialPercent:input.marketAvailable?100:0,stockOfficialPercent:percent(input.stockRecords,input.targetStocks),institutionalOfficialPercent:institutional,industryOfficialPercent:bounded(industryCoverage),
    industryMappedStockCount:Math.max(0,input.industryMappedStockCount??input.industryOfficialRecords),industryUnmappedStockCount:Math.max(0,input.industryUnmappedStockCount??0),industryCount:Math.max(0,input.industryCount??0),industryCoveragePercent:bounded(industryCoverage),heatmapStockCount:Math.max(0,input.heatmapStockCount??0),industrySnapshotCount:Math.max(0,input.industrySnapshotCount??0),industryTechnicalJoinCount:Math.max(0,input.industryTechnicalJoinCount??0),industryDecisionJoinCount:Math.max(0,input.industryDecisionJoinCount??0),industryMappingUpdatedAt:input.industryMappingUpdatedAt??null,industryMappingStale:input.industryMappingStale??false,
    historyDays:Math.max(0,input.historyDays),historyStockCoverageCount:Math.max(0,input.historyStockCoverageCount??0),historyAverageDays:Math.max(0,input.historyAverageDays??input.historyDays),historyComplete250Percent:bounded(input.historyComplete250Percent),indicatorComputablePercent:bounded(input.indicatorComputablePercent),historyStaleCount:Math.max(0,input.historyStaleCount??0),historyFailedSymbols:[...new Set(input.historyFailedSymbols??[])],totalCommonStocks:Math.max(0,input.totalCommonStocks??input.targetStocks),historyComplete250Count:Math.max(0,input.historyComplete250Count??0),technicalIndexCount:Math.max(0,input.technicalIndexCount??0),technicalScoreAvailableCount:Math.max(0,input.technicalScoreAvailableCount??0),decisionJoinCount:Math.max(0,input.decisionJoinCount??0),institutionalJoinCount:Math.max(0,input.institutionalJoinCount??0),alignedCount:Math.max(0,input.alignedCount??0),mismatchedCount:Math.max(0,input.mismatchedCount??0),backfillCompleted:Math.max(0,input.backfillCompleted??0),backfillTotal:Math.max(0,input.backfillTotal??0),backfillStatus:input.backfillStatus??'尚未啟動',updatedAt:input.updatedAt,stale:input.stale||(input.industryMappingStale??false),
    mockFields:['部分健康分數法人長期資料','資金輪動尚未官方化欄位','市場溫度部分因子'],
    derivedFields:['Decision Score','Confidence','Snapshot Score','Technical Score 與固定規則訊號','產業強度與相對排名','漲幅 ≥ 9.5%／跌幅 ≤ -9.5% 衍生統計'],
    missingFields:[...(institutional?[]:['官方法人資料']),...(input.historyStockCoverageCount?[]:['TWSE 官方個股歷史行情']),...(industryAvailable?[]:['TWSE 官方產業分類']), '產業歷史資金流向'],
  }
}
