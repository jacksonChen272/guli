import { useParams } from 'react-router-dom'
import { StockSnapshotPanel } from '../components/stock/StockSnapshotPanel'
import { StockDecisionPanel } from '../components/decision/StockDecisionPanel'
import { StockScoreOverview } from '../components/stock/StockScoreOverview'
import { StockDetail } from './StockDetail'
export function StockDetailWithSnapshot(){const{symbol=''}=useParams();return <div className="space-y-8"><StockScoreOverview symbol={symbol}/><StockDecisionPanel symbol={symbol}/><StockDetail/><StockSnapshotPanel symbol={symbol}/></div>}
