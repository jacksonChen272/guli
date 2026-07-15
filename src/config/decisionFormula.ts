import type { DecisionEntityType } from '../types/decision'
export const formulaVersion='decision-v1.0'
export const decisionWeights:Record<DecisionEntityType,Record<string,number>>={
 stock:{stock_health:.25,daily_price_strength:.2,liquidity:.15,market_environment:.15,industry_environment:.15,risk_control:.1,data_quality:0},
 market:{market_temperature:.25,index_momentum:.2,market_breadth:.2,liquidity_environment:.15,risk_distribution:.2,data_quality:0},
 industry:{industry_strength:.25,industry_momentum:.2,capital_flow:.2,breadth:.15,rank_trend:.1,risk_control:.1,data_quality:0},
 watchlist:{average_decision:.35,strong_ratio:.15,high_risk_ratio:.2,official_coverage:.1,best_stock:.1,worst_stock:.1,data_quality:0},
}
export const decisionRiskThresholds={highPenalty:25,mediumPenalty:12,lowPenalty:5}
export const confidenceRules={mock:8,fallback:15,missing:6,stale:12,warning:3,historyInsufficient:10}
export const decisionLabelFor=(score:number|null)=>score===null?'資料不足':score>=81?'極強':score>=66?'偏強':score>=51?'中性':score>=36?'偏弱':'極弱'
export const directionFor=(score:number|null)=>score===null?'unknown':score>=66?'bullish':score<=50?'bearish':'neutral'
