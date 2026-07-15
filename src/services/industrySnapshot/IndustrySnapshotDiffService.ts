import type { IndustrySnapshot, IndustrySnapshotDiff } from '../../types/industrySnapshot'
const delta = (current: number, previous?: number) => previous === undefined ? null : Number((current - previous).toFixed(2))
export class IndustrySnapshotDiffService {
  compare(current: IndustrySnapshot, previous?: IndustrySnapshot | null): IndustrySnapshotDiff {
    const previousMap = new Map(previous?.industries.map((item) => [item.industryId, item]) ?? [])
    const changes = current.industries.map((item) => { const before = previousMap.get(item.industryId); return { industryId: item.industryId, industryName: item.industryName, rankChange: before ? before.rank - item.rank : null, strengthChange: delta(item.strengthScore, before?.strengthScore), momentumChange: delta(item.momentumScore, before?.momentumScore), capitalFlowChange: delta(item.capitalFlowScore, before?.capitalFlowScore) } })
    const currentTop = new Set(current.industries.slice(0, 5).map((item) => item.industryId)); const previousTop = new Set(previous?.industries.slice(0, 5).map((item) => item.industryId) ?? [])
    return { currentDate: current.tradeDate, previousDate: previous?.tradeDate ?? null, changes, enteredTopFive: current.industries.filter((item) => currentTop.has(item.industryId) && !previousTop.has(item.industryId)).map((item) => item.industryName), exitedTopFive: (previous?.industries ?? []).filter((item) => previousTop.has(item.industryId) && !currentTop.has(item.industryId)).map((item) => item.industryName) }
  }
}
