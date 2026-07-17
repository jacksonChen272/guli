import { useParams } from 'react-router-dom'
import { StockSnapshotPanel } from '../components/stock/StockSnapshotPanel'
import { StockDecisionPanel } from '../components/decision/StockDecisionPanel'
import { StockScoreOverview } from '../components/stock/StockScoreOverview'
import { StockTechnicalAnalysis } from '../components/stock/StockTechnicalAnalysis'
import { StockDetail } from './StockDetail'
export function StockDetailWithSnapshot(){const{symbol=''}=useParams();return <div className="space-y-8"><StockScoreOverview symbol={symbol}/><StockTechnicalAnalysis symbol={symbol} activePageComponent="StockDetailWithSnapshot"/><StockDecisionPanel symbol={symbol}/><StockDetail/><StockSnapshotPanel symbol={symbol}/></div>}
