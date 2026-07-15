import type { DecisionResult } from '../../types/decision'
import { Badge } from '../ui/Badge'
export function DecisionConfidenceBadge({confidence}:{confidence:number}){return <Badge tone={confidence>=81?'brand':confidence>=61?'info':confidence>=41?'neutral':'warning'}>信心 {confidence}%</Badge>}
