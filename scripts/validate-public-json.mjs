import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const PUBLIC_DATA = path.join(process.cwd(), 'public', 'data')
const MAX_JSON_BYTES = 50 * 1024 * 1024
const CONFLICT_PATTERN = /<<<<<<<|=======|>>>>>>>/

export function validateJsonText(text, file = 'unknown.json') {
  const errors = []
  if (!text.trim()) errors.push(`${file}: 檔案為空白`)
  if (CONFLICT_PATTERN.test(text)) errors.push(`${file}: 包含 Git conflict marker`)
  if (text.includes('\uFFFD')) errors.push(`${file}: 包含 Unicode replacement character`)
  let value = null
  try { value = JSON.parse(text) } catch (error) { errors.push(`${file}: JSON.parse 失敗：${error instanceof Error ? error.message : String(error)}`) }
  return { valid: errors.length === 0, errors, value }
}

export function validateJsonShape(value, file) {
  const errors = []
  if (value === null || typeof value !== 'object') return [`${file}: JSON 根節點必須為物件或陣列`]
  if (file.includes('twse-stock-history/stocks/')) {
    const required = ['schemaVersion', 'symbol', 'name', 'market', 'source', 'sourceUrl', 'fetchedAt', 'firstTradeDate', 'lastTradeDate', 'recordCount', 'status', 'warnings', 'prices']
    for (const field of required) if (!(field in value)) errors.push(`${file}: 缺少 ${field}`)
    if (Array.isArray(value.prices)) {
      const dates = new Set()
      for (const point of value.prices) {
        if (!point || typeof point !== 'object' || typeof point.tradeDate !== 'string') { errors.push(`${file}: prices 包含無效項目`); continue }
        if (dates.has(point.tradeDate)) errors.push(`${file}: 重複交易日期 ${point.tradeDate}`)
        dates.add(point.tradeDate)
      }
      if (value.recordCount !== value.prices.length) errors.push(`${file}: recordCount 與 prices 長度不一致`)
    }
  }
  if (file.includes('twse-stock-history/index.json') || file.includes('twse-stock-history/latest.json')) {
    if (value.schemaVersion !== '1.0' || !Array.isArray(value.symbols) || !value.summary) errors.push(`${file}: 歷史行情索引 schema 不完整`)
  }
  return errors
}

async function listJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? listJsonFiles(path.join(directory, entry.name)) : entry.name.endsWith('.json') ? [path.join(directory, entry.name)] : []))
  return nested.flat()
}

export async function validatePublicJson(directory = PUBLIC_DATA) {
  const files = await listJsonFiles(directory)
  const errors = []
  for (const file of files) {
    const info = await stat(file)
    const relative = path.relative(process.cwd(), file).replaceAll('\\', '/')
    if (info.size === 0) { errors.push(`${relative}: 檔案為空白`); continue }
    if (info.size > MAX_JSON_BYTES) { errors.push(`${relative}: 檔案異常過大（${info.size} bytes）`); continue }
    const text = await readFile(file, 'utf8')
    const parsed = validateJsonText(text, relative)
    errors.push(...parsed.errors)
    if (parsed.valid) errors.push(...validateJsonShape(parsed.value, relative))
  }
  return { valid: errors.length === 0, fileCount: files.length, errors }
}

async function main() {
  const result = await validatePublicJson()
  if (!result.valid) {
    console.error(`[data:validate] ${result.errors.length} 個錯誤：`)
    result.errors.forEach((error) => console.error(`- ${error}`))
    process.exitCode = 1
    return
  }
  console.log(`[data:validate] 通過，共驗證 ${result.fileCount} 個 JSON 檔案。`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main()

