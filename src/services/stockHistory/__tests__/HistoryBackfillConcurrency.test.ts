import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { canStartHistoryBackfill } from '../../../../scripts/data/history/HistoryAutomation.ts'

const workflow = readFileSync(path.join(process.cwd(), '.github', 'workflows', 'twse-history-backfill.yml'), 'utf8')

describe('history backfill automation guard', () => {
  it('stops when one automation pull request is open', () => expect(canStartHistoryBackfill(1).allowed).toBe(false))
  it('uses the dedicated non-cancelling concurrency group', () => {
    expect(workflow).toContain('group: twse-history-backfill')
    expect(workflow).toContain('cancel-in-progress: false')
  })
  it('keeps the schedule disabled and defaults to the bounded limits', () => {
    expect(workflow).toContain("# schedule:")
    expect(workflow).toContain("default: '100'")
    expect(workflow).toContain("default: '1200'")
    expect(workflow).toContain("default: '8000'")
  })
})
