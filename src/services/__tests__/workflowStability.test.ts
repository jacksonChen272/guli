import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const text = (file: string) => readFile(file, 'utf8')
const pushToMain = /git push[^\n]*(?:HEAD:main|origin\s+main|:main(?:\s|$))/

describe('GitHub Actions stability guard', () => {
  it('deploy workflow only performs validation, tests, build and Pages deployment', async () => {
    const workflow = await text('.github/workflows/deploy-pages.yml')
    expect(workflow).toContain('npm run data:validate')
    expect(workflow).toContain('npm run test:run')
    expect(workflow).toContain('npm run build')
    expect(workflow).toContain('actions/configure-pages@')
    expect(workflow).toContain('actions/upload-pages-artifact@')
    expect(workflow).toContain('actions/deploy-pages@')
    expect(workflow).not.toMatch(/git\s+(?:add|commit|push|pull)/)
  })

  it('deploy workflow never generates market or analytical datasets', async () => {
    const workflow = await text('.github/workflows/deploy-pages.yml')
    for (const command of ['data:twse', 'snapshot:generate', 'decision:generate', 'technical:index:generate', 'screener:generate', 'heatmap:generate']) {
      expect(workflow).not.toContain(`npm run ${command}`)
    }
  })

  it('deploy workflow uploads only the Vite dist directory', async () => {
    const workflow = await text('.github/workflows/deploy-pages.yml')
    expect(workflow).toMatch(/path:\s*\.\/dist/)
    expect(workflow).not.toMatch(/path:\s*(?:\.\s*$|public\s*$|src\s*$)/m)
    expect(workflow).toMatch(/deploy:\s*[\s\S]*needs:\s*build/)
  })

  it('deploy workflow has minimal Pages permissions and concurrency', async () => {
    const workflow = await text('.github/workflows/deploy-pages.yml')
    expect(workflow).toContain('contents: read')
    expect(workflow).toContain('pages: write')
    expect(workflow).toContain('id-token: write')
    expect(workflow).toContain('group: pages')
    expect(workflow).toContain('cancel-in-progress: true')
  })

  it('daily updates use a dedicated branch and create or update one PR', async () => {
    const workflow = await text('.github/workflows/update-market-data.yml')
    expect(workflow).toContain('DATA_UPDATE_BRANCH: automation/data-updates')
    expect(workflow).toContain('chore(data): update GULI market datasets')
    expect(workflow).toContain('gh pr create')
    expect(workflow).toContain('gh pr edit')
    expect(workflow).not.toMatch(pushToMain)
  })

  it('daily update PR records all required dataset dates and results', async () => {
    const workflow = await text('.github/workflows/update-market-data.yml')
    for (const label of ['市場交易日', '個股交易日', '法人交易日', 'Snapshot 日期', 'Decision 日期', 'Technical Index 日期', 'Screener 日期', 'Heatmap 日期', 'JSON 驗證結果', '測試結果']) {
      expect(workflow).toContain(label)
    }
  })

  it('daily updates stage only public data and skip unchanged runs', async () => {
    const workflow = await text('.github/workflows/update-market-data.yml')
    expect(workflow).toContain('git add public/data')
    expect(workflow).toContain('git diff --cached --quiet')
    expect(workflow).toContain('changed=false')
    expect(workflow).not.toMatch(/git add[^\n]*(?:CHANGELOG|ROADMAP|package\.json|package-lock|src\/|scripts\/|docs\/|Sidebar|Settings)/)
    expect(workflow).toContain('group: market-data-update')
    expect(workflow).toContain('cancel-in-progress: false')
  })

  it('backfill uses its own branch and updates a PR without writing main', async () => {
    const workflow = await text('.github/workflows/backfill-stock-history.yml')
    expect(workflow).toContain('BACKFILL_BRANCH: automation/history-backfill')
    expect(workflow).toContain('gh pr create')
    expect(workflow).toContain('gh pr edit')
    expect(workflow).not.toMatch(pushToMain)
    expect(workflow).toContain('group: stock-history-backfill')
    expect(workflow).toContain('cancel-in-progress: false')
  })

  it('backfill stages only the approved generated dataset paths', async () => {
    const workflow = await text('.github/workflows/backfill-stock-history.yml')
    const addLine = workflow.split(/\r?\n/).find((line) => line.trimStart().startsWith('git add ')) ?? ''
    for (const path of ['public/data/twse-stock-history', 'public/data/technical-index', 'public/data/screener', 'public/data/market-heatmap']) expect(addLine).toContain(path)
    expect(addLine).not.toMatch(/(?:CHANGELOG|ROADMAP|package\.json|package-lock|src\/|scripts\/|docs\/|Sidebar|Settings|twse-stocks)/)
  })

  it('GitHub Pages keeps the Vite base and BrowserRouter basename', async () => {
    expect(await text('vite.config.ts')).toContain("base: '/guli/'")
    expect(await text('src/main.tsx')).toContain('basename="/guli"')
  })

  it('git check covers repository operations, worktree state, JSON and divergence', async () => {
    const script = await text('scripts/check-git-state.mjs')
    for (const token of [
      '--is-inside-work-tree', 'rebase-merge', 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', '--diff-filter=U',
      '--cached', '--exclude-standard', 'JSON.parse(text)', "['fetch', '--quiet', 'origin']", '--left-right', 'origin/main...HEAD',
      "['log', '-1'", 'automation/data-updates', 'automation/history-backfill',
    ]) expect(script).toContain(token)
    expect(script).toContain('process.exitCode = 1')
  })

  it('git check does not mutate local history or push automatically', async () => {
    const script = await text('scripts/check-git-state.mjs')
    expect(script).not.toMatch(/runGit\(\['(?:reset|checkout|pull|push|rebase|commit)'/)
    const packageJson = JSON.parse(await text('package.json')) as { scripts: Record<string, string> }
    expect(packageJson.scripts['git:check']).toBe('node scripts/check-git-state.mjs')
  })
})
