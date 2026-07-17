import type { HistogramData, Time } from 'lightweight-charts'
import type { OfficialStockHistoryPrice } from '../../../types/officialStockHistory'

export function buildVolumeHistogramData(prices: OfficialStockHistoryPrice[]): HistogramData<Time>[] {
  return prices.flatMap((point) => point.volume === null ? [] : [{
    time: point.tradeDate as Time,
    value: point.volume,
    color: (point.change ?? 0) >= 0 ? 'rgba(248, 113, 113, .45)' : 'rgba(52, 211, 153, .45)',
  }])
}

export function VolumeHistogram() {
  return <span className="text-[10px] text-slate-600">成交量依台股慣例以紅漲、綠跌顯示</span>
}

