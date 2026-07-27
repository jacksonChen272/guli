import type { StockAnalysisData } from '../../hooks/useStockAnalysisData'
import { StockKeyLevelsCard } from './StockKeyLevelsCard'
import { StockTechnicalAnalysis } from './StockTechnicalAnalysis'

export function StockPriceAnalysisSection({
  symbol,
  data,
}: {
  symbol: string
  data: StockAnalysisData
}) {
  const historyError = !data.history && data.status !== 'loading'
    ? data.errors.find((error) => error.includes('歷史') || error.toLowerCase().includes('history'))
      ?? '歷史資料尚未取得'
    : null

  return (
    <section
      id="stock-price-analysis-section"
      className="min-w-0 scroll-mt-24"
      aria-labelledby="stock-price-analysis-title"
      data-testid="stock-price-analysis-section"
    >
      <div className="mb-3">
        <p className="eyebrow">PRICE & KEY LEVELS</p>
        <h2 id="stock-price-analysis-title" className="mt-1 text-xl font-semibold text-white">
          價格走勢與關鍵價位
        </h2>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12 xl:items-start">
        <div className="min-w-0 xl:col-span-8">
          <StockTechnicalAnalysis
            symbol={symbol}
            history={data.history}
            indicators={data.indicators}
            priceStructure={data.priceStructure}
            loadStatus={data.status}
            errors={data.errors}
            historyUrl={data.historyUrl}
            onRetry={data.reload}
            activePageComponent="StockDetailWithSnapshot / StockPriceAnalysisSection"
          />
        </div>
        <div className="min-w-0 xl:col-span-4">
          <StockKeyLevelsCard
            analysis={data.priceStructure}
            loadStatus={data.status}
            error={historyError}
            onRetry={data.reload}
          />
        </div>
      </div>
    </section>
  )
}
