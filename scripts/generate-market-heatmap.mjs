import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'public', 'data')
const OUTPUT = path.join(DATA, 'market-heatmap')
const CONFLICT_PATTERN = /<<<<<<<|=======|>>>>>>>/

export async function readSafeJson(file, fallback = null) {
  try {
    const text = await readFile(file, 'utf8')
    if (CONFLICT_PATTERN.test(text)) throw new Error(`${file} 包含 Git conflict marker`)
    if (text.includes('\uFFFD')) throw new Error(`${file} 包含 Unicode replacement character`)
    return JSON.parse(text)
  } catch (error) {
    if (error?.code === 'ENOENT' && fallback !== null) return fallback
    throw error
  }
}

export async function atomicWriteJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  const text = `${JSON.stringify(value, null, 2)}\n`
  if (CONFLICT_PATTERN.test(text) || text.includes('\uFFFD')) throw new Error(`拒絕寫入無效 JSON：${file}`)
  if (!file.endsWith('index.json') && !/[\u3400-\u9fff]/.test(text)) throw new Error(`拒絕寫入缺少可辨識中文內容的 JSON：${file}`)
  await writeFile(temporary, text, 'utf8')
  try { JSON.parse(await readFile(temporary, 'utf8')); await rename(temporary, file) }
  catch (error) { await unlink(temporary).catch(() => undefined); throw error }
}

export function buildIndustryMapping(input) {
  const mapping = new Map()
  for (const industry of input?.industries ?? []) {
    if (!industry?.id || !industry?.name) continue
    for (const stock of industry.stocks ?? []) if (/^\d{4}$/.test(stock.symbol ?? '') && !mapping.has(stock.symbol)) mapping.set(stock.symbol, { industryId: industry.id, industryName: industry.name, source: 'derived' })
  }
  return mapping
}

export function buildOfficialIndustryMapping(dataset) {
  return new Map((dataset?.stocks ?? []).filter((stock) => stock.status === 'official' && stock.industryCode && stock.industryName).map((stock) => [stock.symbol, { industryId: stock.industryCode, industryName: stock.industryName, source: 'official' }]))
}

export function createHeatmapDataset({ stocksDataset, technicalDataset, screenerDataset, decisionDataset, industryMappingDataset, industryInput }) {
  if (!stocksDataset?.tradeDate || !Array.isArray(stocksDataset.records)) throw new Error('twse-stocks/latest.json 結構不完整')
  const mappingUniverse = new Set((industryMappingDataset?.stocks ?? []).map((record) => record.symbol))
  const officialStocks = stocksDataset.records.filter((record) => record.market === 'TWSE' && record.instrumentType === 'stock' && /^\d{4}$/.test(record.symbol) && (!mappingUniverse.size || mappingUniverse.has(record.symbol)))
  const officialMapping = buildOfficialIndustryMapping(industryMappingDataset)
  const derivedMapping = buildIndustryMapping(industryInput)
  const technical = new Map((technicalDataset?.records ?? []).map((record) => [record.symbol, record]))
  const screener = new Map()
  for (const row of screenerDataset?.results ?? []) { const current = screener.get(row.symbol); if (!current || (current.decisionScore === null && row.decisionScore !== null)) screener.set(row.symbol, row) }
  const totalTradingAmount = officialStocks.reduce((sum, record) => sum + (finiteOrNull(record.tradeValue) ?? 0), 0)

  const stockNodes = officialStocks.map((record) => {
    const official = officialMapping.get(record.symbol)
    const derived = official ? null : derivedMapping.get(record.symbol)
    const mapping = official ?? derived ?? { industryId: 'unclassified', industryName: '未分類', source: 'missing' }
    const technicalRow = technical.get(record.symbol) ?? null
    const screenerRow = screener.get(record.symbol) ?? null
    const tradingAmount = finiteOrNull(record.tradeValue)
    const changePercent = calculateChangePercent(record.close, record.change)
    const warnings = []
    if (mapping.source === 'derived') warnings.push('官方產業分類缺值，本節點使用明確標示的 GULI 衍生群組。')
    if (mapping.source === 'missing') warnings.push('尚未取得可驗證的官方或衍生產業分類，保留為未分類。')
    if (technicalRow?.technicalScore === null || !technicalRow) warnings.push('Technical Score 尚未取得。')
    if (screenerRow?.decisionScore === null || !screenerRow) warnings.push('Decision Score 尚未取得。')
    return {
      id:`stock:${record.symbol}`,type:'stock',symbol:record.symbol,name:record.name,industryId:mapping.industryId,industryName:mapping.industryName,
      officialIndustryName:official?.industryName ?? null,displayIndustryGroup:mapping.industryName,mappingStatus:mapping.source,
      tradeDate:record.tradeDate,close:finiteOrNull(record.close),changePercent,tradingAmount,tradingVolume:finiteOrNull(record.tradeVolume),
      marketWeight:tradingAmount!==null&&totalTradingAmount>0?round(tradingAmount/totalTradingAmount*100,4):null,sizeValue:tradingAmount,colorValue:changePercent,
      technicalScore:finiteOrNull(technicalRow?.technicalScore),decisionScore:finiteOrNull(screenerRow?.decisionScore),riskLevel:['low','medium','high'].includes(technicalRow?.riskLevel)?technicalRow.riskLevel:null,
      source:compact(['TWSE Official',official?'TWSE Official Industry':null,derived?'GULI Industry Group (Derived)':null,technicalRow?'Technical Index (Derived)':null,screenerRow?.decisionScore!==null&&screenerRow?'Decision Engine v1.0 (Derived)':null]),status:official&&!(technicalRow||screenerRow)?'official':mapping.source==='missing'?'missing':'mixed',warnings,
    }
  }).sort((a,b)=>a.symbol.localeCompare(b.symbol))

  const groups = new Map(); stockNodes.forEach((stock)=>groups.set(stock.industryId,[...(groups.get(stock.industryId)??[]),stock]))
  const industries=[...groups.entries()].map(([industryId,rows])=>{const tradingAmount=sum(rows,'tradingAmount');const tradingVolume=sum(rows,'tradingVolume');const mappingStatus=rows.some((row)=>row.mappingStatus==='official')?'official':rows.some((row)=>row.mappingStatus==='derived')?'derived':'missing';return{id:`industry:${industryId}`,type:'industry',symbol:null,name:rows[0].industryName,industryId,industryName:rows[0].industryName,officialIndustryName:mappingStatus==='official'?rows[0].industryName:null,displayIndustryGroup:rows[0].industryName,mappingStatus,tradeDate:stocksDataset.tradeDate,close:null,changePercent:weightedMean(rows,'changePercent','tradingAmount'),tradingAmount,tradingVolume,marketWeight:totalTradingAmount>0?round(tradingAmount/totalTradingAmount*100,4):null,sizeValue:tradingAmount,colorValue:weightedMean(rows,'changePercent','tradingAmount'),technicalScore:weightedMean(rows,'technicalScore','tradingAmount'),decisionScore:weightedMean(rows,'decisionScore','tradingAmount'),riskLevel:aggregateRisk(rows),source:compact(['TWSE Official',mappingStatus==='official'?'TWSE Official Industry':mappingStatus==='derived'?'GULI Industry Group (Derived)':null,'GULI Scores (Derived)']),status:mappingStatus==='missing'?'missing':'mixed',warnings:mappingStatus==='missing'?['本群組為未分類，不以名稱猜測產業。']:[]}}).sort((a,b)=>(b.tradingAmount??0)-(a.tradingAmount??0)||a.id.localeCompare(b.id))

  const totalStockUniverse=officialStocks.length
  const officialMappedStockCount=stockNodes.filter((row)=>row.mappingStatus==='official').length
  const derivedMappedStockCount=stockNodes.filter((row)=>row.mappingStatus==='derived').length
  const mappedStockCount=officialMappedStockCount+derivedMappedStockCount
  const unmappedStockCount=Math.max(0,totalStockUniverse-mappedStockCount)
  const coverageRate=percentage(mappedStockCount,totalStockUniverse)
  const officialCoverageRate=percentage(officialMappedStockCount,totalStockUniverse)
  const derivedCoverageRate=percentage(derivedMappedStockCount,totalStockUniverse)
  const generatedAt=latestTimestamp([stocksDataset.fetchedAt,industryMappingDataset?.fetchedAt,technicalDataset?.generatedAt,screenerDataset?.generatedAt,decisionDataset?.generatedAt])??`${stocksDataset.tradeDate}T13:30:00.000Z`
  const warnings=[]
  if(unmappedStockCount)warnings.push(`${unmappedStockCount} 檔普通股尚未分類，已保留在未分類群組。`)
  if(derivedMappedStockCount)warnings.push(`${derivedMappedStockCount} 檔使用明確標示的衍生群組，不會標示為官方產業。`)
  if(technicalDataset?.tradeDate&&technicalDataset.tradeDate!==stocksDataset.tradeDate)warnings.push('Technical Index 與個股盤後資料交易日期不同。')
  if(screenerDataset?.tradeDate&&screenerDataset.tradeDate!==stocksDataset.tradeDate)warnings.push('Screener 與個股盤後資料交易日期不同。')
  const mappingStatus=unmappedStockCount?'Partial':derivedMappedStockCount?'Mixed':'Official'
  return{schemaVersion:'1.0',tradeDate:stocksDataset.tradeDate,generatedAt,sampleSize:stockNodes.length,totalStockUniverse,mappedStockCount,unmappedStockCount,coverageRate,officialMappedStockCount,derivedMappedStockCount,officialCoverageRate,derivedCoverageRate,mappingStatus,mappingUpdatedAt:industryMappingDataset?.fetchedAt??null,mappingEffectiveDate:industryMappingDataset?.effectiveDate??null,sizingMetric:'tradingAmount',colorMetric:'changePercent',industries,stocks:stockNodes,sourceSummary:{official:['TWSE 個股盤後成交資料',...(officialMappedStockCount?['TWSE 上市公司官方產業分類']:[])],derived:compact([derivedMappedStockCount?'GULI 產業群組（衍生）':null,'Technical Index','Decision Engine v1.0']),mock:[],missing:unmappedStockCount?[`${unmappedStockCount} 檔尚未分類`]:[]},status:totalStockUniverse?(unmappedStockCount?'partial':'ready'):'missing',warnings}
}

async function main(){
  const [stocksDataset,technicalDataset,screenerDataset,decisionDataset,industryMappingDataset,industryInput]=await Promise.all([
    readSafeJson(path.join(DATA,'twse-stocks','latest.json')),readSafeJson(path.join(DATA,'technical-index','latest.json'),{records:[]}),readSafeJson(path.join(DATA,'screener','latest.json'),{results:[]}),readSafeJson(path.join(DATA,'decisions','latest.json'),{}),readSafeJson(path.join(DATA,'twse-industries','latest.json'),{stocks:[]}),readSafeJson(path.join(DATA,'industry-snapshot-input.json'),{industries:[]}),
  ])
  const output=createHeatmapDataset({stocksDataset,technicalDataset,screenerDataset,decisionDataset,industryMappingDataset,industryInput})
  await atomicWriteJson(path.join(OUTPUT,'latest.json'),output);await atomicWriteJson(path.join(OUTPUT,'history',`${output.tradeDate}.json`),output)
  const current=await readSafeJson(path.join(OUTPUT,'index.json'),{schemaVersion:'1.0',dates:[]});const entry={tradeDate:output.tradeDate,path:`data/market-heatmap/history/${output.tradeDate}.json`,sampleSize:output.sampleSize,coverageRate:output.coverageRate,status:output.status};const dates=[...(current.dates??[]).filter((item)=>item.tradeDate!==output.tradeDate),entry].sort((a,b)=>a.tradeDate.localeCompare(b.tradeDate));await atomicWriteJson(path.join(OUTPUT,'index.json'),{schemaVersion:'1.0',updatedAt:output.generatedAt,latestTradeDate:output.tradeDate,dates})
  console.log(`[heatmap] ${output.tradeDate}：全市場 ${output.sampleSize} 檔、官方分類 ${output.officialMappedStockCount} 檔、衍生分類 ${output.derivedMappedStockCount} 檔、未分類 ${output.unmappedStockCount} 檔。`)
}

const finiteOrNull=(value)=>typeof value==='number'&&Number.isFinite(value)?value:null
const round=(value,digits=2)=>Number(value.toFixed(digits));const compact=(values)=>values.filter((value)=>typeof value==='string'&&value.length>0);const sum=(rows,field)=>rows.reduce((total,row)=>total+(row[field]??0),0);const percentage=(part,total)=>total?round(part/total*100,2):0
const calculateChangePercent=(close,change)=>{if(!Number.isFinite(close)||!Number.isFinite(change))return null;const previous=close-change;return previous>0?round(change/previous*100,4):null}
const weightedMean=(rows,field,weightField)=>{const available=rows.filter((row)=>Number.isFinite(row[field])&&Number.isFinite(row[weightField])&&row[weightField]>0);const totalWeight=available.reduce((total,row)=>total+row[weightField],0);return totalWeight?round(available.reduce((total,row)=>total+row[field]*row[weightField],0)/totalWeight,4):null}
const aggregateRisk=(rows)=>rows.some((row)=>row.riskLevel==='high')?'high':rows.some((row)=>row.riskLevel==='medium')?'medium':rows.some((row)=>row.riskLevel==='low')?'low':null
const latestTimestamp=(values)=>values.filter((value)=>typeof value==='string'&&Number.isFinite(Date.parse(value))).sort().at(-1)??null

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch((error)=>{console.error(`[heatmap] 產生失敗：${error instanceof Error?error.stack??error.message:String(error)}`);process.exitCode=1})
