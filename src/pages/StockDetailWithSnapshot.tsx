import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardCard } from '../components/dashboard/DashboardCard'
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton'
import { DecisionTraceDrawer } from '../components/decision/DecisionTraceDrawer'
import { InstitutionalAnalysis } from '../components/stock/InstitutionalAnalysis'
import { PriceStructurePanel } from '../components/stock/PriceStructurePanel'
import { StockCommandCenter } from '../components/stock/StockCommandCenter'
import { StockCoreScoreStrip } from '../components/stock/StockCoreScoreStrip'
import { StockDataSources } from '../components/stock/StockDataSources'
import { StockDataStatusBar } from '../components/stock/StockDataStatusBar'
import { StockDecisionExplanation } from '../components/stock/StockDecisionExplanation'
import { StockDecisionTraceEntry } from '../components/stock/StockDecisionTraceEntry'
import { StockIndustryComparison } from '../components/stock/StockIndustryComparison'
import { StockNarrativePanel } from '../components/stock/StockNarrativePanel'
import { StockPageHeader } from '../components/stock/StockPageHeader'
import { StockPriceAnalysisSection } from '../components/stock/StockPriceAnalysisSection'
import { StockRiskAssessment } from '../components/stock/StockRiskAssessment'
import { StockSectionErrorBoundary } from '../components/stock/StockSectionErrorBoundary'
import { PageErrorState } from '../components/system/PageErrorState'
import { useStockAnalysisData } from '../hooks/useStockAnalysisData'
import {
  buildStockCommandViewModel,
  buildStockDataStatusViewModel,
  buildStockScoreViewModel,
} from '../services/stock/StockScoreViewModel'

const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export function StockDetailWithSnapshot() {
  const { symbol = '' } = useParams()
  const navigate = useNavigate()
  const data = useStockAnalysisData(symbol)
  const [traceOpen, setTraceOpen] = useState(false)
  const scoreModel = useMemo(() => buildStockScoreViewModel(data), [data])
  const commandModel = useMemo(() => buildStockCommandViewModel(data), [data])
  const dataStatusModel = useMemo(() => buildStockDataStatusViewModel(data), [data])

  if (!/^\d{4,6}$/.test(symbol)) {
    return (
      <PageErrorState
        title="無效的股票代號"
        description="請輸入 4 至 6 位數字的股票代號。"
      />
    )
  }

  if (data.status === 'loading') {
    return (
      <main
        className="min-w-0 space-y-5 pb-[calc(24px+env(safe-area-inset-bottom))]"
        data-testid="stock-analysis-page"
        aria-busy="true"
      >
        <DashboardCard title={`${symbol} 個股研究`} eyebrow="STOCK PAGE 3.0" state="loading">
          <DashboardSkeleton variant="metrics" rows={6} />
        </DashboardCard>
        <DashboardCard title="Stock Command Center" state="loading"><DashboardSkeleton rows={5} /></DashboardCard>
        <DashboardCard title="五項核心觀察" state="loading"><DashboardSkeleton variant="metrics" rows={5} /></DashboardCard>
        <DashboardCard title="價格走勢與關鍵價位" state="loading"><DashboardSkeleton variant="heatmap" /></DashboardCard>
      </main>
    )
  }

  if (data.status === 'error' && !data.quote && !data.history) {
    return (
      <main className="min-w-0 space-y-5 pb-[calc(24px+env(safe-area-inset-bottom))]" data-testid="stock-analysis-page">
        <StockDataStatusBar
          items={dataStatusModel}
          stale={data.stale}
          partial
          messages={[...data.errors, ...data.warnings]}
          referenceDate={data.dateConsistency.referenceDate}
          onRetry={data.reload}
        />
        <PageErrorState
          title="個股資料暫時無法讀取"
          description={data.errors[0] ?? '請重新讀取，或稍後再試。'}
        />
      </main>
    )
  }

  const openIndustry = () => {
    if (data.industryMapping?.industryCode) {
      navigate(`/industries/${data.industryMapping.industryCode}`)
      return
    }
    scrollToSection('stock-industry-section')
  }

  return (
    <main
      className="page-enter min-w-0 space-y-7 overflow-x-clip pb-[calc(24px+env(safe-area-inset-bottom))] sm:space-y-8"
      data-testid="stock-analysis-page"
    >
      <StockSectionErrorBoundary title="個股標頭" onRetry={data.reload} resetKey={symbol}>
        <StockPageHeader symbol={symbol} data={data} />
      </StockSectionErrorBoundary>

      <StockDataStatusBar
        items={dataStatusModel}
        stale={data.stale}
        partial={data.status === 'partial'}
        messages={[...data.errors, ...data.warnings]}
        referenceDate={data.dateConsistency.referenceDate}
        onRetry={data.reload}
      />

      <StockSectionErrorBoundary title="Stock Command Center" onRetry={data.reload} resetKey={symbol}>
        <StockCommandCenter
          model={commandModel}
          isWatchlisted={data.isWatchlisted}
          onViewTechnical={() => scrollToSection('stock-price-analysis-section')}
          onViewInstitutional={() => scrollToSection('stock-institutional-section')}
          onViewIndustry={openIndustry}
          onToggleWatchlist={data.toggleWatchlist}
        />
      </StockSectionErrorBoundary>

      <StockSectionErrorBoundary title="五項核心觀察" onRetry={data.reload} resetKey={symbol}>
        <StockCoreScoreStrip
          scores={scoreModel}
          onOpenDecisionTrace={() => setTraceOpen(true)}
        />
      </StockSectionErrorBoundary>

      <StockSectionErrorBoundary title="價格走勢與關鍵價位" onRetry={data.reload} resetKey={symbol}>
        <StockPriceAnalysisSection symbol={symbol} data={data} />
      </StockSectionErrorBoundary>

      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12" aria-label="決策與風險說明">
        <div className="min-w-0 xl:col-span-7">
          <StockSectionErrorBoundary title="Decision 說明" onRetry={data.reload} resetKey={symbol}>
            <StockDecisionExplanation
              decision={data.decision}
              onOpenTrace={() => setTraceOpen(true)}
              onRetry={data.reload}
            />
          </StockSectionErrorBoundary>
        </div>
        <div className="min-w-0 xl:col-span-5">
          <StockSectionErrorBoundary title="風險評估" onRetry={data.reload} resetKey={symbol}>
            <StockRiskAssessment risks={data.risks} />
          </StockSectionErrorBoundary>
        </div>
      </section>

      <StockSectionErrorBoundary title="個股敘事" onRetry={data.reload} resetKey={symbol}>
        <StockNarrativePanel narrative={data.narrative} />
      </StockSectionErrorBoundary>

      {data.priceStructure && (
        <StockSectionErrorBoundary title="價格結構說明" onRetry={data.reload} resetKey={symbol}>
          <PriceStructurePanel analysis={data.priceStructure} />
        </StockSectionErrorBoundary>
      )}

      <section id="stock-institutional-section" className="scroll-mt-24">
        <StockSectionErrorBoundary title="法人資料" onRetry={data.reload} resetKey={symbol}>
          <InstitutionalAnalysis data={data} />
        </StockSectionErrorBoundary>
      </section>

      <section id="stock-industry-section" className="scroll-mt-24">
        <StockSectionErrorBoundary title="同業比較" onRetry={data.reload} resetKey={symbol}>
          <StockIndustryComparison data={data} />
        </StockSectionErrorBoundary>
      </section>

      <StockSectionErrorBoundary title="Decision Trace" onRetry={data.reload} resetKey={symbol}>
        <StockDecisionTraceEntry decision={data.decision} onOpen={() => setTraceOpen(true)} />
      </StockSectionErrorBoundary>
      <StockSectionErrorBoundary title="資料來源" onRetry={data.reload} resetKey={symbol}>
        <StockDataSources data={data} />
      </StockSectionErrorBoundary>

      <DecisionTraceDrawer
        decision={data.decision}
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
      />
    </main>
  )
}
