import { useParams } from 'react-router-dom'
import { StockSnapshotPanel } from '../components/stock/StockSnapshotPanel'
import { StockDecisionPanel } from '../components/decision/StockDecisionPanel'
import { StockDetail } from './StockDetail'
export function StockDetailWithSnapshot(){const{symbol=''}=useParams();return <div className="space-y-5"><StockDecisionPanel symbol={symbol}/><StockDetail/><StockSnapshotPanel symbol={symbol}/></div>}
