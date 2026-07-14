import { useMemo } from 'react'
import { marketRepository } from '../../services/dataRepository'
import { generateWatchlistAlerts } from '../../services/watchlistInsightService'
import { useWatchlistStore } from '../../stores/watchlistStore'
import { Card } from '../ui/Card'
import { WatchlistAlertCard } from './WatchlistAlertCard'

const mockStocks = marketRepository.getStocks()

export function WatchlistOverview() { const items = useWatchlistStore((state) => state.items); const alerts = useMemo(() => generateWatchlistAlerts(items, mockStocks), [items]); return <Card title="自選股智慧摘要" eyebrow="Rule-based Alerts" action={<span className="text-[10px] text-slate-600">共 {alerts.length} 則</span>}><div className="flex snap-x gap-3 overflow-x-auto p-4 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">{alerts.slice(0, 8).map((alert) => <WatchlistAlertCard key={alert.id} alert={alert}/>)}</div></Card> }
