import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const CONFLICT_MARKER = /^(?:<{7}|={7}|>{7})(?:\s.*)?$/m

function runGit(args, cwd) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true })
}

function gitOutput(args, cwd) {
  const result = runGit(args, cwd)
  return result.status === 0 ? result.stdout.trim() : null
}

function countEntries(value) {
  return value ? value.split(/\r?\n/).filter(Boolean).length : 0
}

function collectFiles(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((entry) => {
    const target = path.join(directory, entry)
    return statSync(target).isDirectory() ? collectFiles(target) : [target]
  })
}

export function hasConflictMarker(text) {
  return CONFLICT_MARKER.test(text)
}

export function inspectPublicData(directory) {
  const errors = []
  const files = collectFiles(directory)
  let jsonCount = 0

  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const relative = path.relative(directory, file).replaceAll('\\', '/')
    if (hasConflictMarker(text)) errors.push(`${relative} 含有 Git 衝突標記`)
    if (path.extname(file).toLowerCase() !== '.json') continue
    jsonCount += 1
    try {
      JSON.parse(text)
    } catch (error) {
      errors.push(`${relative} 不是有效 JSON：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return { errors, fileCount: files.length, jsonCount }
}

function resolveGitPath(root, name) {
  const value = gitOutput(['rev-parse', '--git-path', name], root)
  return value ? path.resolve(root, value) : null
}

function operationInProgress(root, gitPath) {
  const resolved = resolveGitPath(root, gitPath)
  return Boolean(resolved && existsSync(resolved))
}

export function checkLocalRepository(root) {
  const errors = []
  const warnings = []
  const isRepository = gitOutput(['rev-parse', '--is-inside-work-tree'], root) === 'true'
  const emptyDataResult = { errors: [], fileCount: 0, jsonCount: 0 }

  if (!isRepository) {
    return {
      isRepository,
      branch: null,
      dataResult: emptyDataResult,
      stagedCount: 0,
      unstagedCount: 0,
      untrackedCount: 0,
      errors: ['目前目錄不是 Git repository。'],
      warnings,
    }
  }

  const branch = gitOutput(['branch', '--show-current'], root)
  if (operationInProgress(root, 'rebase-merge') || operationInProgress(root, 'rebase-apply')) {
    errors.push('偵測到未完成的 rebase；請先執行 git rebase --continue 或 git rebase --abort。')
  }
  if (operationInProgress(root, 'MERGE_HEAD')) errors.push('偵測到未完成的 merge；請先完成或中止 merge。')
  if (operationInProgress(root, 'CHERRY_PICK_HEAD')) errors.push('偵測到未完成的 cherry-pick；請先完成或中止 cherry-pick。')
  if (operationInProgress(root, 'REVERT_HEAD')) errors.push('偵測到未完成的 revert；請先完成或中止 revert。')

  const unmerged = gitOutput(['diff', '--name-only', '--diff-filter=U'], root)
  if (unmerged) errors.push(`偵測到 ${countEntries(unmerged)} 個未合併檔案：\n${unmerged}`)

  const stagedCount = countEntries(gitOutput(['diff', '--cached', '--name-only'], root))
  const unstagedCount = countEntries(gitOutput(['diff', '--name-only'], root))
  const untrackedCount = countEntries(gitOutput(['ls-files', '--others', '--exclude-standard'], root))
  if (stagedCount || unstagedCount || untrackedCount) {
    warnings.push(`工作目錄尚有變更：staged ${stagedCount}、unstaged ${unstagedCount}、untracked ${untrackedCount}。`)
  }

  const dataResult = inspectPublicData(path.join(root, 'public', 'data'))
  errors.push(...dataResult.errors)

  return { isRepository, branch, dataResult, stagedCount, unstagedCount, untrackedCount, errors, warnings }
}

function checkRemoteRepository(root, skipFetch) {
  const errors = []
  const warnings = []
  const origin = gitOutput(['remote', 'get-url', 'origin'], root)
  if (!origin) {
    return { origin: null, behind: 0, ahead: 0, diverged: false, localLatest: null, remoteLatest: null, errors: ['找不到 origin remote。'], warnings }
  }

  if (!skipFetch) {
    const fetch = runGit(['fetch', '--quiet', 'origin'], root)
    if (fetch.status !== 0) {
      errors.push(`fetch origin 失敗：${fetch.stderr.trim() || '無法連線遠端 repository'}`)
      return { origin, behind: 0, ahead: 0, diverged: false, localLatest: null, remoteLatest: null, errors, warnings }
    }
  }

  if (gitOutput(['rev-parse', '--verify', 'origin/main'], root) === null) {
    errors.push('找不到 origin/main，無法比較本機與遠端狀態。')
    return { origin, behind: 0, ahead: 0, diverged: false, localLatest: null, remoteLatest: null, errors, warnings }
  }

  const counts = (gitOutput(['rev-list', '--left-right', '--count', 'origin/main...HEAD'], root) ?? '0 0').split(/\s+/).map(Number)
  const behind = counts[0] ?? 0
  const ahead = counts[1] ?? 0
  const diverged = behind > 0 && ahead > 0
  const localLatest = gitOutput(['log', '-1', '--format=%h %cI %an %s', 'HEAD'], root)
  const remoteLatest = gitOutput(['log', '-1', '--format=%h %cI %an %s', 'origin/main'], root)

  if (diverged) {
    errors.push(`本機與 origin/main 已分歧：本機領先 ${ahead} 個、落後 ${behind} 個 commit。`)
  } else if (behind > 0) {
    errors.push(`本機落後 origin/main ${behind} 個 commit；請先執行 git pull --rebase origin main。`)
  }

  if (behind > 0) {
    const automated = gitOutput(['log', '--format=%h %an %s', '--author=github-actions', 'HEAD..origin/main'], root)
    if (automated) errors.push(`origin/main 含尚未同步的 Actions commit：\n${automated}`)
  }

  for (const branch of ['automation/data-updates', 'automation/history-backfill']) {
    const reference = `origin/${branch}`
    if (gitOutput(['rev-parse', '--verify', reference], root) === null) continue
    const pending = Number(gitOutput(['rev-list', '--count', `origin/main..${reference}`], root) ?? '0')
    if (pending > 0) warnings.push(`${branch} 尚有 ${pending} 個 commit 等待 Pull Request 審查。`)
  }

  return { origin, behind, ahead, diverged, localLatest, remoteLatest, errors, warnings }
}

export function main(args = process.argv.slice(2)) {
  const root = process.cwd()
  const local = checkLocalRepository(root)
  const errors = [...local.errors]
  const warnings = [...local.warnings]

  if (!local.isRepository) {
    console.error('[Git] 目前目錄不是 Git repository。')
    process.exitCode = 1
    return
  }

  const remote = checkRemoteRepository(root, args.includes('--no-fetch'))
  errors.push(...remote.errors)
  warnings.push(...remote.warnings)

  console.log(`[Git] 目前分支：${local.branch || 'detached HEAD'}`)
  console.log(`[Git] 本機 HEAD：${remote.localLatest ?? '無法取得'}`)
  console.log(`[Git] origin/main：${remote.remoteLatest ?? '無法取得'}`)
  console.log(`[Git] 差異：領先 ${remote.ahead} 個、落後 ${remote.behind} 個 commit${remote.diverged ? '（已分歧）' : ''}`)
  console.log(`[Git] 工作目錄：staged ${local.stagedCount}、unstaged ${local.unstagedCount}、untracked ${local.untrackedCount}`)
  console.log(`[Git] public/data JSON 驗證：${local.dataResult.errors.length ? '失敗' : `通過，共 ${local.dataResult.jsonCount} 個 JSON`}`)
  warnings.forEach((warning) => console.warn(`[Git] 提醒：${warning}`))

  if (errors.length) {
    console.error('\n[Git] 目前不可安全 push：')
    errors.slice(0, 20).forEach((error) => console.error(`- ${error}`))
    if (errors.length > 20) console.error(`- 另有 ${errors.length - 20} 項錯誤未列出。`)
    process.exitCode = 1
    return
  }

  console.log('[Git] 沒有未完成的 rebase、merge、cherry-pick 或 revert。')
  console.log('[Git] 本機與 origin/main 狀態可安全提交或推送。')
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entry === fileURLToPath(import.meta.url)) main()
