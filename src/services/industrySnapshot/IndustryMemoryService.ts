import type { IndustryMemory, IndustryMemoryEntry, IndustrySnapshot } from '../../types/industrySnapshot'
const topEntry = (map: Map<string, { name: string; value: number }>): IndustryMemoryEntry | null => [...map.entries()].sort((a, b) => b[1].value - a[1].value || a[1].name.localeCompare(b[1].name, 'zh-Hant')).map(([industryId, data]) => ({ industryId, industryName: data.name, value: Number(data.value.toFixed(2)) }))[0] ?? null
export class IndustryMemoryService {
  calculate(input: IndustrySnapshot[], days: number): IndustryMemory {
    const snapshots = [...input].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate)).slice(-days)
    const top = new Map<string, { name: string; value: number }>(); const weak = new Map<string, { name: string; value: number }>(); const totals = new Map<string, { name: string; value: number }>()
    const first = snapshots[0]; const last = snapshots.at(-1)
    for (const snapshot of snapshots) for (const item of snapshot.industries) {
      totals.set(item.industryId, { name: item.industryName, value: (totals.get(item.industryId)?.value ?? 0) + item.strengthScore })
      if (item.rank <= 5) top.set(item.industryId, { name: item.industryName, value: (top.get(item.industryId)?.value ?? 0) + 1 })
      if (item.rank > Math.max(0, snapshot.industries.length - 3)) weak.set(item.industryId, { name: item.industryName, value: (weak.get(item.industryId)?.value ?? 0) + 1 })
    }
    for (const value of totals.values()) value.value /= Math.max(1, snapshots.length)
    const changes = new Map<string, { name: string; value: number }>()
    for (const item of last?.industries ?? []) { const before = first?.industries.find((entry) => entry.industryId === item.industryId); if (before) changes.set(item.industryId, { name: item.industryName, value: before.rank - item.rank }) }
    const streak = (strong: boolean) => { const result = new Map<string, { name: string; value: number }>(); const ids = new Set(snapshots.flatMap((snapshot) => snapshot.industries.map((item) => item.industryId))); ids.forEach((id) => { let current = 0; let best = 0; let name = id; for (const snapshot of snapshots) { const item = snapshot.industries.find((entry) => entry.industryId === id); if (item) name = item.industryName; const matches = item ? strong ? item.status === '強勢' || item.status === '偏強' : item.status === '弱勢' || item.status === '偏弱' : false; current = matches ? current + 1 : 0; best = Math.max(best, current) } result.set(id, { name, value: best }) }); return topEntry(result) }
    const bestChange = topEntry(changes); const worstChange = topEntry(new Map([...changes].map(([id, value]) => [id, { ...value, value: -value.value }]))); if (worstChange) worstChange.value *= -1
    return { requestedDays: days, snapshotCount: snapshots.length, frequentTopFive: [...top.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 3).map(([industryId, value]) => ({ industryId, industryName: value.name, value: value.value })), frequentWeak: [...weak.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 3).map(([industryId, value]) => ({ industryId, industryName: value.name, value: value.value })), mostImproved: bestChange, mostDeclined: worstChange, highestAverageStrength: topEntry(totals), longestStrongStreak: streak(true), longestWeakStreak: streak(false), insufficientData: snapshots.length < days }
  }
}
