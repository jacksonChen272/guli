import { decisionLabelFor, decisionRiskThresholds, directionFor, formulaVersion } from '../../config/decisionFormula'
import type { StockHealthResult } from '../../types/insight'
import type { IndustrySnapshotItem } from '../../types/industrySnapshot'
import type { MarketSnapshot } from '../../types/snapshot'
import type { StockSnapshotItem } from '../../types/stockSnapshot'
import type { DecisionFactor, DecisionInput, DecisionResult } from '../../types/decision'
import { DecisionConfidenceService } from './DecisionConfidenceService'
import { DecisionExplanationService } from './DecisionExplanationService'
import { decisionFactorRegistry as registry } from './DecisionFactorRegistry'
import { DecisionScoringService } from './DecisionScoringService'
import { DecisionValidationService } from './DecisionValidationService'

const clamp = (value:number) => Math.max(0, Math.min(100, Math.round(value * 10) / 10))
const text = {
  market:'\u81fa\u80a1\u5e02\u5834', temperature:'\u5e02\u5834\u6eab\u5ea6', index:'\u52a0\u6b0a\u6307\u6578\u6f32\u8dcc\u5e45', advances:'\u4e0a\u6f32\u5360\u6bd4', amount:'\u6210\u4ea4\u91d1\u984d',
  distribution:'\u4f9d\u5f37\u52e2\u3001\u5f31\u52e2\u8207\u9ad8\u98a8\u96aa\u80a1\u7968\u6578\u8a08\u7b97\u3002', distributionMissing:'\u7f3a\u5c11\u540c\u65e5 Stock Snapshot \u5206\u5e03\u3002',
  health:'\u6cbf\u7528\u65e2\u6709\u56fa\u5b9a\u6b0a\u91cd\u5065\u5eb7\u5206\u6578\uff1b\u4f86\u6e90\u542b Mock \u6b77\u53f2\u3002', healthMissing:'\u7f3a\u5c11\u65e2\u6709\u5065\u5eb7\u5206\u6578\u3002',
  strength:'\u50f9\u683c\u5f37\u5ea6', liquidity:'\u6d41\u52d5\u6027\u767e\u5206\u4f4d', industry:'\u4ee5\u65e2\u6709 Mock \u500b\u80a1\u7522\u696d\u6b04\u4f4d\u7cbe\u78ba\u6bd4\u5c0d Industry Snapshot\u3002', industryMissing:'\u6c92\u6709\u53ef\u9760\u7684\u5b98\u65b9\u7522\u696d mapping\uff0c\u7522\u696d\u56e0\u5b50\u672a\u7d0d\u5165\u3002',
  watchlist:'\u6211\u7684\u81ea\u9078\u80a1', noWatchlist:'\u81ea\u9078\u80a1\u6c92\u6709\u53ef\u7528\u6c7a\u7b56\u8cc7\u6599\u3002',
}

export class DecisionEngine {
  constructor(
    private readonly scoring = new DecisionScoringService(),
    private readonly confidence = new DecisionConfidenceService(),
    private readonly explanation = new DecisionExplanationService(),
    private readonly validation = new DecisionValidationService(),
  ) {}

  evaluate(input:DecisionInput):DecisionResult {
    const scored = this.scoring.score(input.factors)
    const confidence = this.confidence.calculate({ ...input, factors:scored.factors })
    const result:DecisionResult = {
      entityType:input.entityType, entityId:input.entityId, entityName:input.entityName, tradeDate:input.tradeDate,
      score:scored.score, label:decisionLabelFor(scored.score), direction:directionFor(scored.score), confidence:confidence.score,
      summary:this.explanation.explain(scored.score, scored.factors, input.risks), factors:scored.factors, risks:input.risks,
      trace:scored.trace, sources:input.sources, warnings:input.warnings,
    }
    const check = this.validation.validate(result)
    if (!check.valid) throw new Error(`Decision validation failed: ${check.errors.join('; ')}`)
    return result
  }

  market(snapshot:MarketSnapshot):DecisionResult {
    const total = (snapshot.overview.advanceCount ?? 0) + (snapshot.overview.declineCount ?? 0)
    const breadth = total > 0 ? (snapshot.overview.advanceCount ?? 0) / total * 100 : null
    const amount = snapshot.overview.tradingAmount
    const liquidity = amount === null ? null : clamp(20 + amount / 100_000_000_000 * 1.5)
    const stockBreadth = snapshot.stockBreadth
    const distribution = stockBreadth ? clamp(50 + (stockBreadth.strongCount - stockBreadth.weakCount) * .3 - stockBreadth.highRiskCount * .1) : null
    const factors = [
      registry.create('market','market_temperature',snapshot.marketTemperature,'derived',snapshot.marketTemperature,[{ label:text.temperature,value:snapshot.marketTemperature,source:'Market Snapshot',tradeDate:snapshot.tradeDate }]),
      registry.create('market','index_momentum',snapshot.overview.changePercent===null?null:clamp(50+snapshot.overview.changePercent*8),'official',snapshot.overview.changePercent,[{ label:text.index,value:snapshot.overview.changePercent,unit:'%',source:'TWSE',tradeDate:snapshot.tradeDate }]),
      registry.create('market','market_breadth',breadth,'official',breadth,[{ label:text.advances,value:breadth,unit:'%',source:'TWSE',tradeDate:snapshot.tradeDate }]),
      registry.create('market','liquidity_environment',liquidity,'official',amount,[{ label:text.amount,value:amount,unit:'TWD',source:'TWSE',tradeDate:snapshot.tradeDate }]),
      registry.create('market','risk_distribution',distribution,'derived',stockBreadth?`${stockBreadth.strongCount}/${stockBreadth.weakCount}/${stockBreadth.highRiskCount}`:null,[],stockBreadth?text.distribution:text.distributionMissing),
      registry.create('market','data_quality',null,'derived',null),
    ]
    return this.evaluate({
      entityType:'market', entityId:'TWSE', entityName:text.market, tradeDate:snapshot.tradeDate, factors,
      risks:snapshot.risks.map((risk)=>({ code:risk.id,severity:risk.level==='\u9ad8'?'high':risk.level==='\u4e2d'?'medium':'low',title:risk.title,explanation:risk.description,sourceType:risk.source })),
      sources:snapshot.sources.map((source)=>({ id:source.id,name:source.name,type:source.type,tradeDate:source.tradeDate,fields:source.fields })),
      warnings:snapshot.warnings,
    })
  }

  industry(item:IndustrySnapshotItem, tradeDate:string, warnings:string[]=[]):DecisionResult {
    const factors = [
      registry.create('industry','industry_strength',item.strengthScore,'derived'), registry.create('industry','industry_momentum',item.momentumScore,'derived'),
      registry.create('industry','capital_flow',item.capitalFlowScore,'derived'), registry.create('industry','breadth',item.breadthScore,'derived'),
      registry.create('industry','rank_trend',item.rankChange===null?null:clamp(50+item.rankChange*8),'derived',item.rankChange),
      registry.create('industry','risk_control',clamp(100-item.riskScore),'derived',item.riskScore), registry.create('industry','data_quality',null,'derived'),
    ]
    return this.evaluate({ entityType:'industry',entityId:item.industryId,entityName:item.industryName,tradeDate,factors,
      risks:item.risks.map((title,index)=>({ code:`industry-risk-${index}`,severity:item.riskScore>=70?'high':'medium',title,explanation:title,sourceType:'derived' })),
      sources:item.sources.map((source)=>({ id:source.id,name:source.name,type:source.type,tradeDate:source.tradeDate,fields:source.fields })), warnings, historyInsufficient:item.previousRank===null })
  }

  stock(snapshot:StockSnapshotItem, health:StockHealthResult|null, market:DecisionResult|null, industry:DecisionResult|null):DecisionResult {
    const penalty = snapshot.risks.reduce((sum,risk)=>sum+(risk.severity==='high'?decisionRiskThresholds.highPenalty:risk.severity==='medium'?decisionRiskThresholds.mediumPenalty:decisionRiskThresholds.lowPenalty),0)
    const factors:DecisionFactor[] = [
      registry.create('stock','stock_health',health?.totalScore??null,health?'mock':'missing',health?.totalScore??null,[],health?text.health:text.healthMissing),
      registry.create('stock','daily_price_strength',snapshot.priceStrengthScore,'derived',snapshot.priceStrengthScore,[{ label:text.strength,value:snapshot.priceStrengthScore,source:'Stock Snapshot',tradeDate:snapshot.tradeDate }]),
      registry.create('stock','liquidity',snapshot.liquidityScore,'derived',snapshot.liquidityScore,[{ label:text.liquidity,value:snapshot.liquidityScore,source:'Stock Snapshot',tradeDate:snapshot.tradeDate }]),
      registry.create('stock','market_environment',market?.score??null,market?'derived':'missing',market?.score??null),
      registry.create('stock','industry_environment',industry?.score??null,industry?'mock':'missing',industry?.score??null,[],industry?text.industry:text.industryMissing),
      registry.create('stock','risk_control',clamp(100-penalty),'derived',penalty), registry.create('stock','data_quality',null,'derived'),
    ]
    return this.evaluate({ entityType:'stock',entityId:snapshot.symbol,entityName:snapshot.name,tradeDate:snapshot.tradeDate,factors,
      risks:snapshot.risks.map((risk)=>({ code:risk.code,severity:risk.severity,title:risk.title,explanation:risk.reason,sourceType:risk.source })),
      sources:[{ id:'twse-stock',name:'TWSE official stock close',type:'official',tradeDate:snapshot.tradeDate,fields:['quote'] },{ id:'stock-snapshot',name:'GULI Stock Snapshot',type:'derived',tradeDate:snapshot.tradeDate,fields:['priceStrengthScore','liquidityScore','risks'] },...(health?[{ id:'stock-health',name:'GULI Stock Health',type:'mock' as const,fields:['stock_health'] }]:[])],
      warnings:[...snapshot.warnings,...(industry?[]:[text.industryMissing])],
    })
  }

  watchlist(decisions:DecisionResult[]):DecisionResult {
    const scores = decisions.flatMap((item)=>item.score===null?[]:[item.score])
    const average = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null
    const strong = scores.length ? scores.filter((score)=>score>=66).length/scores.length*100 : null
    const highRisk = decisions.length ? decisions.filter((item)=>item.risks.some((risk)=>risk.severity==='high')).length/decisions.length*100 : null
    const official = decisions.length ? decisions.filter((item)=>item.sources.some((source)=>source.type==='official')).length/decisions.length*100 : null
    const factors = [registry.create('watchlist','average_decision',average,'derived'),registry.create('watchlist','strong_ratio',strong,'derived'),registry.create('watchlist','high_risk_ratio',highRisk===null?null:100-highRisk,'derived',highRisk),registry.create('watchlist','official_coverage',official,'derived'),registry.create('watchlist','best_stock',scores.length?Math.max(...scores):null,'derived'),registry.create('watchlist','worst_stock',scores.length?Math.min(...scores):null,'derived'),registry.create('watchlist','data_quality',null,'derived')]
    const date = decisions.map((item)=>item.tradeDate).sort().at(-1) ?? new Date(0).toISOString().slice(0,10)
    return this.evaluate({ entityType:'watchlist',entityId:'my-watchlist',entityName:text.watchlist,tradeDate:date,factors,risks:decisions.flatMap((item)=>item.risks.filter((risk)=>risk.severity==='high').slice(0,1)),sources:[{ id:'watchlist-decisions',name:'Stock decision aggregation',type:'derived',tradeDate:date,fields:['score','risks'] }],warnings:decisions.length?[]:[text.noWatchlist] })
  }
}
export const decisionEngine = new DecisionEngine()
export { formulaVersion }
