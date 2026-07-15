import { describe,expect,it } from 'vitest'
import { formulaVersion } from '../../../config/decisionFormula'
import { DecisionScoringService } from '../DecisionScoringService'
import { factor } from './decisionTestFixtures'
describe('DecisionTraceService',()=>{const service=new DecisionScoringService();it('uses formula version',()=>expect(service.score([factor('a',60,1)]).trace.formulaVersion).toBe(formulaVersion));it('reports normalization and missing weight',()=>{const trace=service.score([factor('a',60,.6),factor('b',null,.4)]).trace;expect(trace.normalizationApplied).toBe(true);expect(trace.missingWeight).toBe(.4)});it('factor contributions sum to trace contribution',()=>{const result=service.score([factor('a',80,.6),factor('b',30,.4)]);expect(result.factors.reduce((sum,item)=>sum+(item.contribution??0),0)).toBeCloseTo(result.trace.totalContribution,2)})})
