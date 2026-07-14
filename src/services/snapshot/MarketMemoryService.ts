import type { MarketMemory, MarketSnapshot } from '../../types/snapshot'
const mostFrequent = (values: string[]) => { if (!values.length) return null; const counts = new Map<string, number>(); values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1)); const [name, count] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-TW'))[0]; return { name, count } }
export class MarketMemoryService {
  calculate(snapshots: MarketSnapshot[], days: number): MarketMemory {
    const selected = [...snapshots].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate)).slice(0, Math.max(0, days))
    const bullishDays = selected.filter((item) => item.marketStatus === '偏強' || item.marketStatus === '極強').length
    const bearishDays = selected.filter((item) => item.marketStatus === '偏弱' || item.marketStatus === '極弱').length
    const temperatures = selected.map((item) => ({ date: item.tradeDate, value: item.marketTemperature }))
    return { requestedDays: days, snapshotCount: selected.length, bullishDays, neutralDays: selected.length - bullishDays - bearishDays, bearishDays, averageTemperature: selected.length ? Number((selected.reduce((sum, item) => sum + item.marketTemperature, 0) / selected.length).toFixed(1)) : null, highestTemperature: temperatures.length ? [...temperatures].sort((a, b) => b.value - a.value)[0] : null, lowestTemperature: temperatures.length ? [...temperatures].sort((a, b) => a.value - b.value)[0] : null, mostFrequentStrongIndustry: mostFrequent(selected.flatMap((item) => item.topIndustries.map((industry) => industry.name))), mostFrequentWeakIndustry: mostFrequent(selected.flatMap((item) => item.weakIndustries.map((industry) => industry.name))), insufficientData: selected.length < Math.min(days, 5) }
  }
}
