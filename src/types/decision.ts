export type DecisionEntityType = 'market' | 'industry' | 'stock' | 'watchlist'
export type DecisionDirection = 'bullish' | 'neutral' | 'bearish' | 'unknown'
export type DecisionLabel = '極強' | '偏強' | '中性' | '偏弱' | '極弱' | '資料不足'
export type DecisionSourceType = 'official' | 'derived' | 'mock' | 'fallback' | 'missing'
export interface DecisionEvidence { label:string; value:number|string|null; unit?:string; tradeDate?:string; source:string }
export interface DecisionContribution { factorCode:string; weightedValue:number|null; signedContribution:number|null }
export interface DecisionFactor { code:string; name:string; rawValue:number|string|null; normalizedScore:number|null; weight:number; contribution:number|null; direction:'positive'|'neutral'|'negative'|'unknown'; explanation:string; evidence:DecisionEvidence[]; sourceType:DecisionSourceType }
export interface DecisionRisk { code:string; severity:'low'|'medium'|'high'; title:string; explanation:string; sourceType:DecisionSourceType }
export interface DecisionSource { id:string; name:string; type:DecisionSourceType; tradeDate?:string; fields:string[] }
export interface DecisionTrace { formulaVersion:string; totalPositiveContribution:number; totalNegativeContribution:number; totalContribution:number; availableWeight:number; missingWeight:number; normalizationApplied:boolean; calculationSteps:string[] }
export interface DecisionConfidence { score:number; label:'高'|'中高'|'中'|'偏低'|'低'; deductions:Array<{code:string; value:number; reason:string}> }
export interface DecisionResult { entityType:DecisionEntityType; entityId:string; entityName:string; tradeDate:string; score:number|null; label:DecisionLabel; direction:DecisionDirection; confidence:number; summary:string; factors:DecisionFactor[]; risks:DecisionRisk[]; trace:DecisionTrace; sources:DecisionSource[]; warnings:string[] }
export interface DecisionComparison { entityType:DecisionEntityType; entityId:string; currentDate:string; previousDate:string|null; available:boolean; scoreChange:number|null; confidenceChange:number|null; labelChanged:boolean; addedRisks:string[]; removedRisks:string[]; warnings:string[] }
export interface DecisionInput { entityType:DecisionEntityType; entityId:string; entityName:string; tradeDate:string; factors:DecisionFactor[]; risks:DecisionRisk[]; sources:DecisionSource[]; warnings:string[]; stale?:boolean; historyInsufficient?:boolean }
