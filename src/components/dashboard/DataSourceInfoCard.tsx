import { Clock3, Database, HardDrive, Radio, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { OfficialStockDatasetStatus } from '../../types/officialStockData'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
export function DataSourceInfoCard({onReload}:{onReload?:()=>void}){
  const[,setRevision]=useState(0);const[loading,setLoading]=useState(false);const[stockStatus,setStockStatus]=useState<OfficialStockDatasetStatus|null>(null);const status=repositoryHub.getPlatformStatus();const official=status.official
  const loadStocks=async(force=false)=>{if(force)await repositoryHub.stocks.refreshOfficialData();setStockStatus(await repositoryHub.stocks.getOfficialDatasetStatus())}
  useEffect(()=>{void loadStocks()},[])
  const reload=async()=>{setLoading(true);await Promise.all([repositoryHub.refreshMarket(),loadStocks(true)]);setLoading(false);setRevision((value)=>value+1);onReload?.()}
  const items=[{icon:Database,label:'市場 Provider',value:status.provider.id==='twse'?'TWSE':'Mock'},{icon:Radio,label:'市場總覽',value:official?.status==='official'?'官方':official?.status==='partial'?'部分官方':'Mock／回退'},{icon:Database,label:'上市個股',value:stockStatus?.available?`TWSE ${stockStatus.status==='official'?'官方':'部分'}`:'Mock／未載入'},{icon:Clock3,label:'個股交易日',value:stockStatus?.tradeDate??'—'},{icon:ShieldCheck,label:'個股筆數',value:stockStatus?.recordCount.toLocaleString()??'—'},{icon:HardDrive,label:'市場 Cache',value:status.cache},{icon:TriangleAlert,label:'個股 Stale',value:stockStatus?.stale?'是':'否'}]
  const warnings=[...(official?.warnings??[]),...(stockStatus?.warnings??[])]
  return <Card eyebrow="DATA PLATFORM" title="資料來源狀態" action={<Button size="sm" variant="ghost" disabled={loading} onClick={()=>void reload()} icon={<RefreshCw size={13} className={loading?'animate-spin':''}/>}>重新讀取網站 JSON</Button>}><div className="grid gap-px bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{items.map(({icon:Icon,label,value})=><div key={label} className="bg-[var(--bg-card)] px-4 py-4"><div className="mb-2 flex items-center gap-2 text-[9px] text-slate-500"><Icon size={12}/>{label}</div><p className="truncate text-[11px] font-medium text-slate-200" title={String(value)}>{value}</p></div>)}</div><div className="border-t border-[var(--border-subtle)] px-5 py-3 text-[10px] leading-5 text-amber-200/70">{warnings.length?warnings.slice(0,4).map((warning)=><p key={warning}>• {warning}</p>):<p>市場總覽與上市個股 JSON 均可讀取；法人與技術指標仍為 Mock／derived。</p>}</div></Card>
}
