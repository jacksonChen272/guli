export interface RefreshTask { id: string; intervalMs: number; run: () => Promise<void> }
export interface RefreshTaskStatus { id: string; intervalMs: number; running: boolean; lastRunAt?: string }

export class RefreshScheduler {
  private tasks = new Map<string, RefreshTask>()
  private timers = new Map<string, number>()
  private lastRuns = new Map<string, string>()
  register(task: RefreshTask) { this.tasks.set(task.id, task); return () => this.unregister(task.id) }
  unregister(id: string) { this.stop(id); this.tasks.delete(id) }
  start(id: string) { const task = this.tasks.get(id); if (!task || this.timers.has(id) || typeof window === 'undefined') return false; const timer = window.setInterval(() => { void this.refreshNow(id) }, task.intervalMs); this.timers.set(id, timer); return true }
  stop(id: string) { const timer = this.timers.get(id); if (timer !== undefined && typeof window !== 'undefined') window.clearInterval(timer); this.timers.delete(id) }
  stopAll() { [...this.timers.keys()].forEach((id) => this.stop(id)) }
  async refreshNow(id: string) { const task = this.tasks.get(id); if (!task) return false; await task.run(); this.lastRuns.set(id, new Date().toISOString()); return true }
  list(): RefreshTaskStatus[] { return [...this.tasks.values()].map((task) => ({ id: task.id, intervalMs: task.intervalMs, running: this.timers.has(task.id), lastRunAt: this.lastRuns.get(task.id) })) }
}
export const refreshScheduler = new RefreshScheduler()
