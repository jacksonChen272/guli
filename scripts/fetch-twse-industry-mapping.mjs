import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'public', 'data')
const OUTPUT = path.join(DATA, 'twse-industries')
const PRIMARY_URL = 'https://openapi.twse.com.tw/v1/opendata/t187ap03_L'
const BACKUP_URL = 'https://mopsfin.twse.com.tw/opendata/t187ap03_L.csv'
const TIMEOUT_MS = 15_000
const RETRIES = 3
const CONFLICT = /<<<<<<<|=======|>>>>>>>/
const INDUSTRY_NAMES = Object.freeze({
  '01':'水泥工業','02':'食品工業','03':'塑膠工業','04':'紡織纖維','05':'電機機械','06':'電器電纜','08':'玻璃陶瓷','09':'造紙工業','10':'鋼鐵工業','11':'橡膠工業','12':'汽車工業','14':'建材營造','15':'航運業','16':'觀光餐旅','17':'金融保險','18':'貿易百貨','19':'綜合','20':'其他','21':'化學工業','22':'生技醫療業','23':'油電燃氣業','24':'半導體業','25':'電腦及週邊設備業','26':'光電業','27':'通信網路業','28':'電子零組件業','29':'電子通路業','30':'資訊服務業','31':'其他電子業','35':'綠能環保','36':'數位雲端','37':'運動休閒','38':'居家生活',
})

export async function fetchWithRetry(url, fetcher = fetch) {
  let lastError
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const response = await fetcher(url, { signal: controller.signal, headers: { accept: 'application/json,text/csv;q=0.9,*/*;q=0.5', 'user-agent': 'GULI-Data-Sync/1.0' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
      const body = await response.text()
      if (!body.trim()) throw new Error('空白回應')
      return { body, contentType, url }
    } catch (error) {
      lastError = error
      if (attempt < RETRIES) await new Promise((resolve) => setTimeout(resolve, attempt * 500))
    } finally { clearTimeout(timeout) }
  }
  throw new Error(`${url} 取得失敗：${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

export function parseOfficialResponse({ body, contentType, url }) {
  const trimmed = body.replace(/^\uFEFF/, '').trim()
  if (contentType.includes('json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
    let parsed
    try { parsed = JSON.parse(trimmed) } catch { throw new Error(`${url} 回應宣告或看似 JSON，但無法解析`) }
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : null
    if (!rows) throw new Error(`${url} JSON 未包含資料陣列`)
    return rows
  }
  if (contentType.includes('csv') || trimmed.includes(',')) return parseCsv(trimmed)
  throw new Error(`${url} 回應不是可支援的 JSON 或 CSV`)
}

export function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { row.push(cell); cell = '' }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[index + 1] === '\n') index += 1; row.push(cell); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = '' }
    else cell += char
  }
  row.push(cell); if (row.some((value) => value.trim())) rows.push(row)
  const headers = rows.shift()?.map((value) => value.trim()) ?? []
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ''])))
}

const rawText = (value) => value == null ? '' : String(value).trim()
const rawField = (record, names) => names.map((name) => record?.[name]).find((value) => rawText(value))
const normalizeCode = (value) => { const raw = rawText(value).replace(/\D/g, ''); return /^\d{1,2}$/.test(raw) ? raw.padStart(2, '0') : null }
export const normalizeRocDate = (value) => {
  const raw = rawText(value).replace(/[^0-9]/g, '')
  const normalized = /^\d{7}$/.test(raw) ? `${Number(raw.slice(0,3))+1911}-${raw.slice(3,5)}-${raw.slice(5,7)}` : /^\d{8}$/.test(raw) ? `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}` : null
  return normalized && Number.isFinite(Date.parse(`${normalized}T00:00:00Z`)) ? normalized : null
}

export function createIndustryDataset(records, stockDataset, { fetchedAt, sourceUrl }) {
  if (!Array.isArray(records) || records.length < 100) throw new Error(`官方公司資料筆數異常：${records?.length ?? 0}`)
  const rawBySymbol = new Map()
  for (const record of records) { const symbol = rawText(rawField(record,['公司代號','公司代碼','股票代號','Code'])); if (/^\d{4}$/.test(symbol) && !rawBySymbol.has(symbol)) rawBySymbol.set(symbol, record) }
  const universe = stockDataset?.records?.filter((row) => {
    if (row.market !== 'TWSE' || row.instrumentType !== 'stock' || !/^\d{4}$/.test(row.symbol)) return false
    const raw = rawBySymbol.get(row.symbol)
    return normalizeCode(rawField(raw,['產業別','產業代號','Industry'])) !== '91'
  }) ?? []
  if (universe.length < 100) throw new Error(`TWSE 普通股 universe 筆數異常：${universe.length}`)
  const dates = records.map((record) => normalizeRocDate(rawField(record,['出表日期','資料日期','Date']))).filter(Boolean).sort()
  const effectiveDate = dates.at(-1) ?? fetchedAt.slice(0,10)
  const warnings = []
  const stocks = universe.map((stock) => {
    const raw = rawBySymbol.get(stock.symbol)
    const code = raw ? normalizeCode(rawField(raw,['產業別','產業代號','Industry'])) : null
    const industryName = code ? INDUSTRY_NAMES[code] ?? null : null
    if (code && !industryName) warnings.push(`${stock.symbol} 的官方產業代碼 ${code} 尚未納入支援表。`)
    return { symbol:stock.symbol, name:rawText(rawField(raw,['公司簡稱','公司名稱','股票名稱','Name']))||stock.name, market:'TWSE', instrumentType:'stock', industryCode:industryName?code:null, industryName, source:'TWSE', status:industryName?'official':'missing', updatedAt:fetchedAt }
  }).sort((a,b)=>a.symbol.localeCompare(b.symbol))
  const counts = new Map(); stocks.forEach((stock)=>{if(stock.industryCode)counts.set(stock.industryCode,(counts.get(stock.industryCode)??0)+1)})
  const industries = [...counts.entries()].map(([industryCode,stockCount])=>({industryCode,industryName:INDUSTRY_NAMES[industryCode],stockCount,source:'TWSE',status:'official'})).sort((a,b)=>a.industryCode.localeCompare(b.industryCode))
  const mappedStockCount = stocks.filter((stock)=>stock.status==='official').length
  const unmappedStockCount = stocks.length-mappedStockCount
  if (unmappedStockCount) warnings.push(`${unmappedStockCount} 檔普通股尚未取得可驗證的官方產業分類，保留為未分類。`)
  const dataset={schemaVersion:'1.0',market:'TWSE',source:'TWSE',sourceUrl,fetchedAt,effectiveDate,totalRecords:records.length,stockRecords:stocks.length,excludedRecords:Math.max(0,records.length-stocks.filter((stock)=>rawBySymbol.has(stock.symbol)).length),mappedStockCount,unmappedStockCount,status:unmappedStockCount?'partial':'official',warnings:[...new Set(warnings)],industries,stocks}
  validateDataset(dataset,new Set(universe.map((row)=>row.symbol)))
  return dataset
}

export function validateDataset(dataset, universeSymbols) {
  const errors=[]; const seen=new Set()
  if(dataset.schemaVersion!=='1.0'||dataset.market!=='TWSE'||dataset.source!=='TWSE')errors.push('來源或 schema 無效')
  if(!/^https:\/\/(openapi|mopsfin)\.twse\.com\.tw\//.test(dataset.sourceUrl))errors.push('來源 URL 非 TWSE 官方網域')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dataset.effectiveDate)||!Number.isFinite(Date.parse(dataset.fetchedAt)))errors.push('日期無效')
  if(dataset.stockRecords!==dataset.stocks.length||dataset.mappedStockCount+dataset.unmappedStockCount!==dataset.stockRecords)errors.push('資料筆數不一致')
  for(const stock of dataset.stocks){if(!/^\d{4}$/.test(stock.symbol)||stock.instrumentType!=='stock'||!universeSymbols.has(stock.symbol))errors.push(`${stock.symbol} 非普通股 universe`);if(seen.has(stock.symbol))errors.push(`${stock.symbol} 重複`);seen.add(stock.symbol);if(stock.status==='official'&&(!stock.industryCode||INDUSTRY_NAMES[stock.industryCode]!==stock.industryName))errors.push(`${stock.symbol} 產業代碼與名稱無效`);if(stock.status==='missing'&&(stock.industryCode!==null||stock.industryName!==null))errors.push(`${stock.symbol} missing 欄位未保留 null`)}
  if(errors.length)throw new Error(errors.join('；'))
}

async function readJson(file, fallback = null) { try { const text=await readFile(file,'utf8'); if(CONFLICT.test(text)||text.includes('\uFFFD'))throw new Error(`${file} 含無效文字`); return JSON.parse(text) } catch(error){if(error?.code==='ENOENT'&&fallback!==null)return fallback;throw error} }
async function atomicWriteJson(file,value){await mkdir(path.dirname(file),{recursive:true});const temporary=`${file}.${process.pid}.tmp`;const text=`${JSON.stringify(value,null,2)}\n`;if(CONFLICT.test(text)||text.includes('\uFFFD'))throw new Error(`拒絕寫入無效 JSON：${file}`);await writeFile(temporary,text,'utf8');try{JSON.parse(await readFile(temporary,'utf8'));await rename(temporary,file)}catch(error){await unlink(temporary).catch(()=>undefined);throw error}}

async function main(){
  console.log('[industry-mapping] 開始同步 TWSE 官方上市公司產業分類。')
  const stockDataset=await readJson(path.join(DATA,'twse-stocks','latest.json'))
  let response
  try{response=await fetchWithRetry(PRIMARY_URL)}catch(primaryError){console.warn(`[industry-mapping] OpenAPI 失敗，改讀 MOPS CSV：${primaryError.message}`);response=await fetchWithRetry(BACKUP_URL)}
  const records=parseOfficialResponse(response)
  const dataset=createIndustryDataset(records,stockDataset,{fetchedAt:new Date().toISOString(),sourceUrl:response.url})
  await atomicWriteJson(path.join(OUTPUT,'latest.json'),dataset)
  await atomicWriteJson(path.join(OUTPUT,'history',`${dataset.effectiveDate}.json`),dataset)
  const current=await readJson(path.join(OUTPUT,'index.json'),{schemaVersion:'1.0',datasets:[]})
  const entry={effectiveDate:dataset.effectiveDate,path:`data/twse-industries/history/${dataset.effectiveDate}.json`,stockRecords:dataset.stockRecords,mappedStockCount:dataset.mappedStockCount,coverageRate:dataset.stockRecords?Number((dataset.mappedStockCount/dataset.stockRecords*100).toFixed(2)):0,status:dataset.status}
  const datasets=[...(current.datasets??[]).filter((item)=>item.effectiveDate!==entry.effectiveDate),entry].sort((a,b)=>a.effectiveDate.localeCompare(b.effectiveDate))
  await atomicWriteJson(path.join(OUTPUT,'index.json'),{schemaVersion:'1.0',updatedAt:dataset.fetchedAt,latestEffectiveDate:dataset.effectiveDate,datasets})
  console.log(`[industry-mapping] 成功：來源 ${dataset.sourceUrl}；有效日 ${dataset.effectiveDate}；普通股 ${dataset.stockRecords} 檔；官方分類 ${dataset.mappedStockCount} 檔；未分類 ${dataset.unmappedStockCount} 檔。`)
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)main().catch((error)=>{console.error(`[industry-mapping] 同步失敗；既有有效 JSON 未被覆蓋：${error instanceof Error?error.stack??error.message:String(error)}`);process.exitCode=1})
