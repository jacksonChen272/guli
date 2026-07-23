import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(path.join(process.cwd(), 'src', 'components', 'settings', 'HistoryProgressCard.tsx'), 'utf8')

describe('HistoryProgressCard wiring', () => {
  it('loads data through RepositoryHub instead of fetching JSON', () => {
    expect(source).toContain('repositoryHub.historyProgress.get')
    expect(source).not.toContain('fetch(')
  })
  it('provides loading, error, stale and responsive progress states', () => {
    expect(source).toContain('LoadingState')
    expect(source).toContain('state="error"')
    expect(source).toContain('資料可能過期')
    expect(source).toContain('min-w-0')
    expect(source).toContain('role="progressbar"')
  })
})
