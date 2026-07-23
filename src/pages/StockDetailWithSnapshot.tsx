import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { DecisionTraceDrawer } from '../components/decision/DecisionTraceDrawer'
import { InstitutionalAnalysis } from '../components/stock/InstitutionalAnalysis'
import { PriceStructurePanel } from '../components/stock/PriceStructurePanel'
import { StockAnalysisDataGuard } from '../components/stock/StockAnalysisDataGuard'
import { StockAnalysisHero } from '../components/stock/StockAnalysisHero'
import { StockCoreScores } from '../components/stock/StockCoreScores'
import { StockDataSources } from '../components/stock/StockDataSources'
import { StockDecisionTraceEntry } from '../components/stock/StockDecisionTraceEntry'
import { StockIndustryComparison } from '../components/stock/StockIndustryComparison'
import { StockNarrativePanel } from '../components/stock/StockNarrativePanel'
import { StockRiskAssessment } from '../components/stock/StockRiskAssessment'
import { StockTechnicalAnalysis } from '../components/stock/StockTechnicalAnalysis'
import { PageErrorState } from '../components/system/PageErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useStockAnalysisData } from '../hooks/useStockAnalysisData'

export function StockDetailWithSnapshot() {
  const { symbol = '' } = useParams()
  const data = useStockAnalysisData(symbol)
  const [traceOpen, setTraceOpen] = useState(false)
  if (!/^\d{4,6}$/.test(symbol)) return <PageErrorState title="股票代號格式不正確" description="請輸入 4 至 6 位數股票代號。"/>
  if (data.status === 'loading') return <main className="min-w-0 space-y-5 pb-[calc(24px+env(safe-area-inset-bottom))]" data-testid="stock-analysis-page"><StockAnalysisDataGuard data={data}/><div className="panel p-6"><LoadingState rows={8}/></div></main>
  if (data.status === 'error' && !data.quote && !data.history) return <main className="min-w-0 space-y-5 pb-[calc(24px+env(safe-area-inset-bottom))]" data-testid="stock-analysis-page"><StockAnalysisDataGuard data={data}/><PageErrorState title="個股資料暫時無法顯示" description={data.errors[0] ?? '官方行情與歷史資料均未取得，請稍後重試。'}/></main>
  return <main className="page-enter min-w-0 space-y-7 pb-[calc(24px+env(safe-area-inset-bottom))] sm:space-y-8" data-testid="stock-analysis-page">
    <StockAnalysisDataGuard data={data}/>
    <StockAnalysisHero symbol={symbol} data={data}/>
    <StockCoreScores data={data} onOpenDecisionTrace={() => setTraceOpen(true)}/>
    <StockNarrativePanel narrative={data.narrative}/>
    <StockTechnicalAnalysis symbol={symbol} history={data.history} indicators={data.indicators} priceStructure={data.priceStructure} loadStatus={data.status} errors={data.errors} historyUrl={data.historyUrl} onRetry={data.reload} activePageComponent="StockDetailWithSnapshot"/>
    {data.priceStructure && <PriceStructurePanel analysis={data.priceStructure}/>} 
    <InstitutionalAnalysis data={data}/>
    <StockIndustryComparison data={data}/>
    <StockRiskAssessment risks={data.risks}/>
    <StockDecisionTraceEntry decision={data.decision} onOpen={() => setTraceOpen(true)}/>
    <StockDataSources data={data}/>
    <DecisionTraceDrawer decision={data.decision} open={traceOpen} onClose={() => setTraceOpen(false)}/>
  </main>
}
