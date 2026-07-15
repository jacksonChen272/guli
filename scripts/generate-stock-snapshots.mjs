import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const sourcePath = path.join(root, 'public/data/twse-stocks/latest.json')
const outputRoot = path.join(root, 'public/data/stock-history')
const T = { insufficient:'\u8cc7\u6599\u4e0d\u8db3', strong:'\u5f37\u52e2', positive:'\u504f\u5f37', neutral:'\u4e2d\u6027', negative:'\u504f\u5f31', weak:'\u5f31\u52e2', up:'\u4e0a\u6f32', down:'\u4e0b\u8dcc', flat:'\u5e73\u76e4' }
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value * 10) / 10))
const round = (value) => Math.round(value * 100) / 100
const weighted = (parts) => { const valid = parts.filter(([value]) => value !== null && Number.isFinite(value)); const weight = valid.reduce((sum, [, partWeight]) => sum + partWeight, 0); return weight ? clamp(valid.reduce((sum, [value, partWeight]) => sum + value * partWeight, 0) / weight) : null }
const percentile = (records, key) => { const values = records.map((record) => record[key]).filter((value) => Number.isFinite(value) && value >= 0).sort((a,b)=>a-b); return (value) => { if (value === null || !values.length) return null; if (values.length === 1) return 50; let low=0; while(low<values.length&&values[low]<value)low++; let high=low; while(high<values.length&&values[high]===value)high++; return clamp(((low+high-1)/2)/(values.length-1)*100) } }
const statusFor = (score) => score === null ? T.insufficient : score >= 81 ? T.strong : score >= 66 ? T.positive : score >= 51 ? T.neutral : score >= 36 ? T.negative : T.weak
const risk = (code, severity, title, reason, source='derived') => ({ code, severity, title, reason, source })
const atomicWrite = async (file, value) => { await fs.mkdir(path.dirname(file), { recursive:true }); const temporary = `${file}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value,null,2)}\n`, 'utf8'); await fs.rename(temporary,file) }
const validRecord = (record) => record.instrumentType === 'stock' && record.status !== 'invalid' && record.market === 'TWSE' && Boolean(record.symbol) && /^\d{4}-\d{2}-\d{2}$/.test(record.tradeDate) && [record.open,record.high,record.low,record.close,record.tradeVolume,record.transactionCount,record.tradeValue].every((value)=>value===null||(Number.isFinite(value)&&value>=0)) && !(record.high!==null&&record.low!==null&&record.high<record.low)

function createItem(record, valuePercentile, volumePercentile, transactionPercentile) {
  const previous = record.close !== null && record.change !== null ? record.close-record.change : null
  const changePercent = previous > 0 ? round(record.change/previous*100) : null
  const dailyRangePercent = record.high !== null && record.low > 0 ? round((record.high-record.low)/record.low*100) : null
  const pricePosition = record.close !== null && record.high !== null && record.low !== null ? record.high===record.low ? 50 : clamp((record.close-record.low)/(record.high-record.low)*100) : null
  const priceStrengthScore = weighted([[changePercent===null?null:clamp(50+changePercent*5),45],[pricePosition,35],[record.open===null||record.close===null?null:record.close>record.open?70:record.close<record.open?30:50,20]])
  const liquidityScore = weighted([[valuePercentile(record.tradeValue),45],[volumePercentile(record.tradeVolume),35],[transactionPercentile(record.transactionCount),20]])
  const pe = record.peRatio
  const valuationRiskScore = pe===null?null:pe<=0?70:pe<=15?20:pe<=25?35:pe<=40?55:pe<=60?75:90
  const snapshotScore = priceStrengthScore===null||liquidityScore===null?null:weighted([[priceStrengthScore,45],[liquidityScore,35],[valuationRiskScore===null?null:100-valuationRiskScore,20]])
  const risks=[], warnings=[...(record.warnings??[])]
  if(changePercent!==null&&changePercent>=7)risks.push(risk('extreme_daily_gain','high','\u55ae\u65e5\u6f32\u5e45\u504f\u5927',`\u55ae\u65e5\u6f32\u5e45 ${changePercent.toFixed(2)}% \u9054 7% \u9580\u6abb\u3002`))
  if(changePercent!==null&&changePercent<=-7)risks.push(risk('extreme_daily_loss','high','\u55ae\u65e5\u8dcc\u5e45\u504f\u5927',`\u55ae\u65e5\u8dcc\u5e45 ${changePercent.toFixed(2)}% \u9054 -7% \u9580\u6abb\u3002`))
  if(dailyRangePercent!==null&&dailyRangePercent>=8)risks.push(risk('wide_daily_range','medium','\u55ae\u65e5\u632f\u5e45\u504f\u5927',`\u55ae\u65e5\u632f\u5e45 ${dailyRangePercent.toFixed(2)}% \u9054 8% \u9580\u6abb\u3002`))
  if(pricePosition!==null&&pricePosition<=20)risks.push(risk('close_near_low','medium','\u6536\u76e4\u63a5\u8fd1\u4f4e\u9ede',`\u6536\u76e4\u4f4d\u65bc\u7576\u65e5\u5340\u9593\u7b2c ${pricePosition.toFixed(1)} \u767e\u5206\u4f4d\u3002`))
  if(liquidityScore!==null&&liquidityScore<=15)risks.push(risk('low_liquidity','medium','\u6d41\u52d5\u6027\u504f\u4f4e',`\u7576\u65e5\u6d41\u52d5\u6027\u5206\u6578 ${liquidityScore.toFixed(1)} \u4e0d\u9ad8\u65bc 15\u3002`))
  if(pe!==null&&pe>=60)risks.push(risk('unusually_high_pe','medium','\u672c\u76ca\u6bd4\u504f\u9ad8',`\u5b98\u65b9\u672c\u76ca\u6bd4 ${pe.toFixed(2)} \u9054\u4e00\u822c\u6027 60 \u500d\u9580\u6abb\uff1b\u672a\u505a\u7522\u696d\u6bd4\u8f03\u3002`, 'official'))
  if([record.open,record.high,record.low,record.close].some((value)=>value===null)){risks.push(risk('missing_ohlc','high','\u50f9\u91cf\u6b04\u4f4d\u4e0d\u5b8c\u6574','\u5b98\u65b9\u958b\u9ad8\u4f4e\u6536\u81f3\u5c11\u4e00\u9805\u7f3a\u6f0f\u3002','official'));warnings.push('OHLC \u8cc7\u6599\u4e0d\u5b8c\u6574\uff0c\u90e8\u5206\u884d\u751f\u5206\u6578\u53ef\u80fd\u70ba\u7a7a\u503c\u3002')}
  if(pe===null){risks.push(risk('missing_pe','low','\u672c\u76ca\u6bd4\u672a\u63d0\u4f9b','\u5b98\u65b9\u8cc7\u6599\u672a\u63d0\u4f9b\u672c\u76ca\u6bd4\uff0c\u4f30\u503c\u98a8\u96aa\u4e0d\u8a08\u5206\u3002','official'));warnings.push('\u672c\u76ca\u6bd4\u7f3a\u503c\uff0csnapshotScore \u4ee5\u53ef\u7528\u6b0a\u91cd\u91cd\u65b0\u6b63\u898f\u5316\u3002')}
  if(record.status==='partial')risks.push(risk('partial_official_data','medium','\u5b98\u65b9\u8cc7\u6599\u70ba\u90e8\u5206\u72c0\u614b','\u4f86\u6e90\u8cc7\u6599\u6a19\u793a\u70ba partial\u3002','official'))
  return { symbol:record.symbol,name:record.name,tradeDate:record.tradeDate,market:'TWSE',instrumentType:'stock',quote:{open:record.open,high:record.high,low:record.low,close:record.close,change:record.change,changePercent,tradeVolume:record.tradeVolume,transactionCount:record.transactionCount,tradeValue:record.tradeValue,peRatio:pe},dailyRangePercent,turnoverAverageValue:record.transactionCount&&record.tradeValue!==null?round(record.tradeValue/record.transactionCount):null,pricePosition,liquidityScore,priceStrengthScore,valuationRiskScore,snapshotScore,status:statusFor(snapshotScore),risks,tags:[statusFor(snapshotScore),changePercent>0?T.up:changePercent<0?T.down:T.flat],sources:[{type:'official',name:'TWSE',field:'quote'},{type:'derived',name:'GULI deterministic rules',field:'scores'}],warnings:[...new Set(warnings)] }
}

try {
  const dataset = JSON.parse(await fs.readFile(sourcePath,'utf8'))
  if(dataset?.schemaVersion!=='1.0'||dataset?.market!=='TWSE'||!/^\d{4}-\d{2}-\d{2}$/.test(dataset?.tradeDate)||!Array.isArray(dataset.records))throw new Error('TWSE stock dataset schema invalid')
  const stocks = dataset.records.filter(validRecord)
  const valuePercentile=percentile(stocks,'tradeValue'), volumePercentile=percentile(stocks,'tradeVolume'), transactionPercentile=percentile(stocks,'transactionCount')
  const generatedAt = new Date().toISOString()
  const records = stocks.map((record)=>createItem(record,valuePercentile,volumePercentile,transactionPercentile))
  const dateDir=path.join(outputRoot,dataset.tradeDate)
  await Promise.all(records.map((item)=>atomicWrite(path.join(dateDir,'stocks',`${item.symbol}.json`),item)))
  const summaries=records.map((item)=>({symbol:item.symbol,name:item.name,close:item.quote.close,changePercent:item.quote.changePercent,tradeValue:item.quote.tradeValue,priceStrengthScore:item.priceStrengthScore,liquidityScore:item.liquidityScore,snapshotScore:item.snapshotScore,status:item.status,riskCount:item.risks.length,highRiskCount:item.risks.filter((entry)=>entry.severity==='high').length}))
  const daily={schemaVersion:'1.0',market:'TWSE',tradeDate:dataset.tradeDate,generatedAt,recordCount:records.length,records:summaries,sources:[{type:'official',name:'TWSE daily closing quotes'},{type:'derived',name:'GULI Stock Snapshot rules'}],warnings:[...(dataset.warnings??[])]}
  await atomicWrite(path.join(dateDir,'index.json'),daily); await atomicWrite(path.join(outputRoot,'latest.json'),daily)
  let archive={schemaVersion:'1.0',updatedAt:generatedAt,snapshots:[]};try{archive=JSON.parse(await fs.readFile(path.join(outputRoot,'index.json'),'utf8'))}catch{}
  archive.snapshots=[{tradeDate:dataset.tradeDate,path:`data/stock-history/${dataset.tradeDate}/index.json`,recordCount:records.length},...(archive.snapshots??[]).filter((entry)=>entry.tradeDate!==dataset.tradeDate)].sort((a,b)=>b.tradeDate.localeCompare(a.tradeDate));archive.updatedAt=generatedAt
  await atomicWrite(path.join(outputRoot,'index.json'),archive)
  console.log(`[stock-snapshot] success tradeDate=${dataset.tradeDate} input=${dataset.records.length} stocks=${records.length} excluded=${dataset.records.length-records.length} warnings=${daily.warnings.length}`)
} catch(error) { console.error(`[stock-snapshot] failed: ${error instanceof Error?error.message:String(error)}`); process.exitCode=1 }
